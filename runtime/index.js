require("sugar").extend()

const { observe, computed, dispose } = require("hyperactiv"),
      { Observable, Computable } = require("hyperactiv/mixins"),
      ObservableObject = Computable(Observable(Object));

const utility = {
    at: require('node-schedule').scheduleJob,
    get time() { return Date.create() },
    require,
    process,
    observe,
    computed,
    dispose,
    Observable,
    Computable,
    ObservableObject
}

let math = require("simple-statistics")
Object.assign(math, require("numeric"))
Object.assign(math, require("numbers"))

const esprima = require("esprima"),
      escodegen = require("escodegen");

function computedStatement(...args) {
    return {
        "type": "ExpressionStatement",
        "expression": {
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "computed"
            },
            "arguments": [
                {
                    "type": "ArrowFunctionExpression",
                    "id": null,
                    "params": [],
                    "body": {
                        "type": "BlockStatement",
                        "body": [ ...args ]
                    },
                    "generator": false,
                    "expression": false,
                    "async": true
                }
            ]
        }
    }    
} 

function translateRules(src) {
    let tree = esprima.parseScript(src);
    tree.body = tree.body.map(line => {
        if (line.type == "LabeledStatement") {
            if (line.label.name == "when") {
                if (line.body.type == "IfStatement") {
                    console.log("Valid when statement")
                    return computed(line.body)
                }
                else throw new Error("When statement must take an if condition")
            }
            else if (line.label.name == "set") {
                return computedStatement(line.body)
            }
            else return line;
        }
        else return line;
    });
    
    return escodegen.generate(tree);
}

const Context = require("./context");
function createContext(session) {
    let context = new Context(require("../lib/constants"), math, utility, global);
    
    context.global("require('sugar').extend()");
    context.resolvers.push(name => session.quote(name));
    
    Object.defineProperty(context, "rules", { value: translateRules })
    
    Object.defineProperty(context, "read", { 
        value: path => { 
            let src = fs.readFileSync(path).toString().trim();
            src = path.endsWith(".r.js") || src.startsWith("/*rules*/") ? translateRules(src) : src;
        } 
    })
    
    Object.defineProperty(context, "import", { value: path => context.module(context.read(path)) })
    
    Object.defineProperty(context, "include", { value: path => context.global(context.read(path)) })
    
    context.scopes.push({
        import: context.import,
        include: context.include
    })
    
    return context
}

module.exports = createContext;