// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: folder;
module.exports = {
  getCalendar,
  getTravelsToday,
  getUpcomingTravelIDs,
  getTravel,
  getTravels,
  getUpcomingTravels
}


async function getCalendar(calName) {
  return await Calendar.forEventsByTitle(calName)
}

async function getTravels() {
  const c = await getCalendar("Automatiska resor")
  let data = []
//   data.push(await CalendarEvent.lastWeek([c]))
  for (e of await CalendarEvent.thisWeek([c])) {
    data.push(e)
  }
  for (e of await CalendarEvent.nextWeek([c])) {
    data.push(e)
  }
  return convertEventToTravel(data)
}

async function getTravelsToday() {
  const c = await Calendar.forEventsByTitle("Automatiska resor")
  let data = await CalendarEvent.today([c])
  return convertEventToTravel(data)
}

async function getUpcomingTravels() {
  let data = await getTravelsToday()
  let d = new Date()
  let travels = []
  for (e of data) {
    if (e["endDate"] > d) {
      travels.push(e)
    }
  }
  return travels
}

async function getUpcomingTravelIDs() {
  let data = await getTravelsToday()
  let d = new Date()
  let travels = []
  for (e of data) {
    if (e["endDate"] > d) {
      let travel = e["details"]["ResID"]
      if (!travels.includes(travel)) {
        travels.push(travel)
      }
    }
  }
  return travels
}

async function getTravel(ID) {
  let travels = await getTravels()
  return travels.filter(filterID)
  function filterID(travel) {
    return travel["details"]["ResID"] == ID
  }
}

function convertEventToTravel(data) {
   // Konverterar kalenders notes string till en riktig dict
  let newData = []
  for (e of data) {
    newData.push({
      "title":e["title"],
      "startDate":e["startDate"],
      "endDate":e["endDate"],
      "details":JSON.parse(e["notes"])
    })
  }
  return newData
}