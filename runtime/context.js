const esprima = require('esprima'),
      vm = require('vm'),
      repl = require('repl');

module.exports = class Context {
    
    constructor() {
        Object.defineProperty(this, "scopes", { 
            value: Array.create(arguments), 
            enerumable: false 
        });
        
        Object.defineProperty(this, "scope", { 
            value: new Proxy({ }, {
                has: (scope, name) => {
                    return this.scopes.some(scope => name in scope);
                },
                get: (scope, name) => {
                    return (this.scopes.find(scope => name in scope) || { })[name];
                },
                set: (scope, name, value) => {
                    let match = this.scopes.find(scope => name in scope);
                    if (match) match[name] = value;
                    else this.scopes[0][name] = value;
                    return true;
                },
                deleteProperty: (scope, name) => {
                    let match = this.scopes.find(scope => name in scope);
                    if (match) {
                        delete match[name];
                        return true;
                    }
                    else return false;
                }
            }),
            enumerable: false
        });

        Object.defineProperty(this, "resolvers", { 
            value: [ ],
            enumerable: false
        });
        
        Object.defineProperty(this, "vm", { 
            value: vm.createContext(this.scope),
            enumerable: false
        });
    }
    
    async resolve(name, property) {
        for (let i = 0; i < this.resolvers.length; i++) {
            let resolver = this.resolvers[i];
            if (Object.isFunction(resolver)) {
                let result = await resolver(name);
                if (result) {
                    if (property) this.scope[property] = result;
                    return result;
                }
            }
            else throw new Error("Resolver " + resolver.toString() + " is not a function.");
        }
    }
    
    async reifyImplicitIdentifiers(ids) {
        if (Array.isArray(ids)) return Promise.all(ids.map(async id => this.scope[id] = await this.resolve(id.substr(1))));
        else this.scope[ids] = await this.resolve(ids.substr(1));
    }
    
    async reifyImplicitIdentifiersInSrc(src) {
        let ids = esprima.tokenize(src.toString()).filter(
            token => token.type == "Identifier" && token.value[0] == "$" && token.value.length > 1
        ).map("value").unique().filter(id => this.scope[id] == null);
        
        await this.reifyImplicitIdentifiers(ids);
    }
    
    async runInContext(src, file) {
        if (this.resolvers.length) await this.reifyImplicitIdentifiersInSrc(src);
        return await vm.runInContext(src.toString(), this.vm, { filename: file });
    }
    
    get replEval() {
        return (cmd, cxt, filename, cb) => {
            this.runInContext(cmd).then(val => cb(null, val)).catch(e => {
                if (e.name === "SyntaxError" && /^(Unexpected end of input|Unexpected token)/.test(e.message)) cb(new repl.Recoverable(e));
                else cb(e);
            });
        };
    }
    
    async call(fn) {
        if (this.resolvers.length) await this.reifyImplicitIdentifiersInSrc(fn);
        fn = vm.runInContext(`(${fn.toString()})`, this.vm, { columnOffset: 2 });
        return await fn();
    }
    
    async module(src, file) {
        if (this.resolvers.length) await this.reifyImplicitIdentifiersInSrc(src);
        let fn = vm.runInContext(`(async exports => {\n${src.toString()}\nreturn exports\n})`, this.vm, { filename: file, lineOffset: -1 });
        Object.assign(this.scopes[0], await fn({ }))
    }
    
    async global(src, file) {
        this.runInContext(src, file);
    }
    
}