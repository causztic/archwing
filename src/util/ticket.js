// Ticket PDF generated via https://keyflight.io/fake
export const parseTicketPDF = (text) => {
  const arr = text.split('\n');
  if (arr.length < 35) {
    console.log("Invalid PDF");
    return {};
  }
  const resCode = arr[4].split(' ')[2];
  const flightNum = arr[9];
  const airline = arr[10].split(': ')[1];
  const ticketClass = arr[11].split(': ')[1];
  const departureAirport = arr[13] + " " + arr[14];
  const arrivalAirport = arr[15] + " " + arr[16];
  const departureDate = arr[7].split('Please')[0]
                            .split(':')[1];
  const departureTime = arr[26];
  const arrivalTime = arr[30];
  const passengerName = arr[34].split('Check-in')[0];
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
  };
}

export const constructQuery = (json) => {
  const depDateArr = json.departureDate.split(' ');
  const depStr = depDateArr[2] + " " + depDateArr[1] + " " + depDateArr[3]
                       + " " + json.departureTime;
  const departure = new Date(depStr).getTime() / 1000;
  return '?booking_number=' + json.resCode + '&departure=' + departure;
}