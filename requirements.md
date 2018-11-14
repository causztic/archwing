# Description

Develop a Dapp that manages insurance for travelers. Through a web front-end,
a traveler should be able to:

- Buy insurance submitting legitimate ticket evidence. 
    Static prices are SGD$30 or 150 loyalty points when round-trip tickets,
    SGD$20 or 100 points when one-way ticket.

- Payment could be made by integration in-time with Metamask or
    Mist Ethereum wallet using tokens.

- Loyalty program. Every time a traveler buys insurance, he/she gets points:
    30 points for a round trip ticket insurance, and 10 points otherwise.

- Claim money back under following rules. Only the traveler triggers this action.

  - If flight only delayed, the traveler gets SGD$200

  - If flights canceled, the traveler receives SDG$5,000

  - If a traveler got money when the flight was delayed but it turns out
        to be canceled, he/she can get the remainder SGD$4,800.

The Dapp should perform the following tasks automatically.

- Get the correct rate or conversion SGD/ETH for calculating the
    correct value to pay in Ethers at the transaction moment.

- Read, analyze, and extract tickets data. Consider reading PDF or
    images with QR codes
- Request information about flights existence and status to a legitimate
    data source (e.g., Changi Airport) through a contract to contract communication.


# Project requirements

- It must have a web front-end and a back-end.
    For instance: Flask + Web3 + Ethereum smart contract

- Payments/donations/transactions/etc. could be made by integration
    in-time with Metamask or Mist Ethereum wallet using tokens

- Amount to pay/donate/transfer/etc. is in Ethers should be
    dynamically calculated by consulting conversion rate between fiat money and Ethers

- Points would be deducted in case of vulnerabilities or errors
    found (for instance, double spending or unfairness)

- The report should explain and show functionalities details;
    include an Ethereum Gas analysis (e.g., efficiency) 

- Source code with instructions to execute the project;
    include testing data

- Web design, UX design, and presentation


