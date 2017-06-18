"use strict";

const sdk = require("..");

sdk.open((err, session) => {
    if (err) {
        console.log(err);
    }
    else {
        session.securities("AAPL stock", (err, secs) => {
            if (err) {
                console.log(err);
            }
            else {
                let AAPL = secs[0];
                
                AAPL.fundamental(sdk.flags.FUNDAMENTALS_REPORTS.financials, (err, report) => {
                    if (err) console.log(err);
                    else console.log(report);
                });
                
                AAPL.quote.snapshot((err, quote) => {
                    if (err) console.log(err);
                    else console.log(quote);
                });
                
                AAPL.quote.stream().on("update", data => {
                    console.log(data);
                });
                
                AAPL.depth.stream().on("update", data => {
                    console.log(data);
                });
                
                AAPL.charts.minutes.five.history(() => {
                    console.log(AAPL.charts.minutes.five.series);
                });
                
                AAPL.charts.minutes.five.stream().on("update", data => {
                    console.log(data);
                });
            }
        });
        
        setTimeout(() => {
            session.close();
        }, 10000);
    }
});