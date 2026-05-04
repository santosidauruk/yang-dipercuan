I currently have an excel file to record all of my historical portfolio. purchase history, sales, portfolio list, dividend history. I want to create a web application so that all the data can be transferred to this web app, so the features I expect are:

## functional requirements
- current portfolio recording 
  - on this page there is also an allocation chart: there are 2 charts, by sector and by issuer 
  - comparison chart between portfolio and ihsg 
  - can be sorted based on profit percentage, invested value, current value 
  - there is summary data: total invested, total value, % increase/decrease, capital increase/decrease
- purchase history: Purchase Date, Stock Code, Purchase Price, Trailing Stop, Last Price, Increase / Decrease, Dividend, Yield from Dividend, ∆ (percentage increase / decrease + dividend) 
  - can be filtered based on issuer 
  - can be sorted based on date and issuer
- sales history: Purchase Date, Sale Date, Stock Code, Purchase Price, Total Lot, Purchase Value, Selling Price, Selling Value, ∆ ((Selling Price / Purchase Price) - 1), Capital Gain
  - can be filtered based on issuer 
  - can be sorted based on date and issuer
- dividend history: Receipt Date, Stock Code, Purchase Price, Total Lot, Purchase Value, Dividend Per Share, Dividend Yield, Total Dividend
  - can be filtered based on issuer 
  - can be sorted based on % dividend yield, capital gained 
  - filtered and sorted at the same time 

## non-functional requirements
- all data is stored in the browser
- all data (portfolio data, purchases, sales, and dividend) can be imported from csv and exported to csv
- every record (portfolio,  purchases, sales and dividend) can be edited
- there is a delete feature, per row record or delete all data (postage, purchase, sale, dividend). when the user wants to delete, ask if they want to be exported first or not

## additional notes
- this is related to ./implementation-gaps.md
  - remove login and authentication
  - no need to implement /onboard and /settings
  - ai chat is to discuss about our current watchlist and portfolio, plan this but we will implement this later. user need to select their provider and put their api key to use this feature