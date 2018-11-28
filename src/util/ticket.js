// Useless because pdfjs node_module doesn't seem to work on React
// Probably gonna deprecate/remove this

function pdf2Text(pdfFile) {
    return PDFJS.getDocument(pdfFile).then(function(pdf) {
        let pagePromise = pdf.getPage(1).then(function(page) {
            return page.getTextContent().then(function(content) {
                let text = ''
                let lastY = -1;
                content.items.forEach(function(item) {
                    if (lastY !== item.transform[5]) {
                        text += '\n'
                        lastY = item.transform[5]
                    }
                    text += item.str.trim()
                })
                
                return text
            });
        });
        
        return pagePromise.then(function(text) {
            console.log(text)
            return text;
        });
    });
}

export function parseTicket(pdfFile) {
    return pdf2Text(pdfFile)
    .then(function(text) {
        let arr = text.split('\n')
        let resCode = arr[4].split(' ')[2]
        let flightNum = arr[9]
        let airline = arr[10].split(': ')[1]
        let ticketClass = arr[11].split(': ')[1]
        let departureAirport = arr[13] + " " + arr[14]
        let arrivalAirport = arr[15] + " " + arr[16]
        let departureDate = arr[7].split('Please')[0]
                                .split(':')[1]
        let departureTime = arr[26]
        let arrivalTime = arr[30]
        let passengerName = arr[34].split('Check-in')[0]

        return {
            resCode,
            flightNum,
            airline,
            ticketClass,
            departureAirport,
            departureDate,
            departureTime,
            arrivalAirport,
            arrivalTime,
            passengerName
        }
    })
}
