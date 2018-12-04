// Ticket PDF generated via https://keyflight.io/fake
// The PDF parsing library didn't work so we are converting the PDFs
// to images and using OCR instead

export const parseTicket = (text) => {
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
