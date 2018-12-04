// Ticket PDF generated via https://keyflight.io/fake
export const parseTicketPDF = (text) => {
  const arr = text.split('\n')
  const resCode = arr[4].split(' ')[2]
  const flightNum = arr[9]
  const airline = arr[10].split(': ')[1]
  const ticketClass = arr[11].split(': ')[1]
  const departureAirport = arr[13] + " " + arr[14]
  const arrivalAirport = arr[15] + " " + arr[16]
  const departureDate = arr[7].split('Please')[0]
                            .split(':')[1]
  const departureTime = arr[26]
  const arrivalTime = arr[30]
  const passengerName = arr[34].split('Check-in')[0]
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
}

// Deprecated
export const parseTicketOCR = (text) => {
  let arr = text.split('\n')
  const resCode = arr[3].split(' ')[2]
  const flightNum = arr[10].split(' ')[0]
  const airline = arr[11].split(' ')[1]
  const ticketClass = arr[12].split(' ')[1]
  const airports1 = arr[7].split(' ').slice(1, 3)
  const airports2 = arr[8].split(' ').slice(0, 2)
  const departureAirport = airports1[0] + " " + airports2[0]
  const arrivalAirport = airports1[1] + " " + airports2[1]
  const departureDate = arr[6].split(' ').slice(1, 5).join(' ')
  const tempArr = arr[14].split(' ')
  const departureTime = tempArr[2].substr(0, 2) + ":" + tempArr[2].substr(3)
  const arrivalTime = tempArr[3].substr(0, 2) + ":" + tempArr[3].substr(3)
  const passengerName = arr[2]

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
}