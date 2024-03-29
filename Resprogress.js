let CalendarHelper = importModule("Calendar Helper")


const bg = new Color("1B1B1C")
let points = []
API_key = "e8e6589fc7b44336ba991293a816ced9"
const colors = {
  false:{ // light mode
    background:Color.white(),
    text:Color.black(),
    dimmedText:new Color("474747"),
    progressbar:new Color("295FF4"),
    progressbarBg:new Color("D6D6D6"),
    progressbarWalkBg:new Color("EBEBEB"),
    start:new Color("64C466"),
    end:new Color("EA4D3D"),
    warning:new Color("EF8C00")
  }, // dark mode
  true:{
    background:Color.black(),
    text:Color.white(),
    dimmedText:new Color("BFBFBF"),
    progressbar:new Color("295FF4"),
    progressbarBg:new Color("1E1E1E"),
    progressbarWalkBg:new Color("474747"),
    start:new Color("64C466"),
    end:new Color("EA4D3D"),
    warning:new Color("EF8C00")
  }
}
const mode = Device.isUsingDarkAppearance()

let travels = await CalendarHelper.getUpcomingTravelIDs()

if (travels.length == 0) {
// no active or future travelling
  let w = new ListWidget()
  w.addText("Ingen kommande eller pågående resa hittades.").centerAlignText()
  w.presentMedium()
  Script.complete()
  return
}

travels = await CalendarHelper.getTravel(travels[0])
const startDate = travels[0]["startDate"]
const endDate = travels[travels.length-1]["endDate"]
const duration = endDate - startDate

// points = getPoints(travels)




// async function getTravel(depTime) {
//   let req = new Request(`https://api.sl.se/api2/TravelplannerV3_1/trip.json?key=${API_key}&amp;&originExtId=9117&destExtId=9541&Passlist=1&Time=${"12:00"}`)
//   let resp = await req.loadJSON()
// 
//   QuickLook.present(resp)
// }



let w = new ListWidget()
Script.setWidget(w)
w.backgroundColor = colors[mode].background
w.refreshAfterDate = new Date(Date.now()+1000*30)

const ctx = new DrawContext()
ctx.opaque = false
ctx.size = new Size(500, 200)
ctx.setTextColor(colors[mode].text)
ctx.respectScreenScale = true

DrawProgressbar()
DrawTimeLabel()
if (GetUpcomingStationsThisLeg().length > 0) {
	DrawNextStations()
}
else {
  await DrawWaitForLeg()
}


ctx.fillPath()

w.addImage(ctx.getImage()).centerAlignImage()


w.presentMedium()


Script.complete()




function getPoints(data, sliceEnd = false) {
  let points = []
  for (e of data) {
    for (date of ["startDate", "endDate"]) {
      let d = new Date(e[date])
      let color
      if (date == "startDate") {
        color = colors[mode].start
      }
      else if (date == "endDate") {
        color = colors[mode].end
      }
      
      let name
      if (date == "startDate") {
        name = e.details.Stops[0].name
      }
      else {
        name = e.details.Stops[e.details.Stops.length-1].name
      }
      
      points.push({
        "name":name,
        "percentage":((d-startDate) * 0.000017) / ((endDate - startDate) * 0.000017),
        "date":d,
        "color":color
      })
    }
  }
  if (sliceEnd) {
    points = points.slice(1, -1)
  }
  return points
}

function getProgress() {
  let t = new Date() - startDate
  return t / duration
}

function DrawProgressbar() {
  const progbg = new Path()
  ctx.setFillColor(colors[mode].progressbarBg)
  progbg.addRoundedRect(new Rect(0, ctx.size.height-20, ctx.size.width, 20), 10, 10)
  ctx.addPath(progbg)
  ctx.fillPath()
  
  for (p of getPoints(travels, true)) {
    let pos = ctx.size.width*p["percentage"]
    
    // add progressbar bg
    const progbg = new Path()
    if (p.color == colors[mode].start) {
      ctx.setFillColor(colors[mode].progressbarBg)
    }
    else {
      ctx.setFillColor(colors[mode].progressbarWalkBg)
    }
  
    progbg.addRoundedRect(new Rect(pos-10, ctx.size.height-20, ctx.size.width-pos, 20), 10, 10)
    ctx.addPath(progbg)
    ctx.fillPath()
  }
  
  const prog = new Path()
  ctx.setFillColor(colors[mode].progressbar)
  prog.addRoundedRect(new Rect(0, ctx.size.height-20, ctx.size.width * getProgress(), 20), 10, 10)
  ctx.addPath(prog)
  ctx.fillPath()
  
  ctx.setFillColor(colors[mode].start)
  ctx.setFont(Font.mediumSystemFont(16))
  ctx.setTextAlignedCenter()
  let i = 0
  for (p of getPoints(travels, true)) {
    // add points
    let pos = ctx.size.width*p["percentage"]
    ctx.setFillColor(p.color)
    ctx.fillEllipse(new Rect(pos-10, ctx.size.height-20, 20, 20))
    ctx.setTextColor(colors[mode].text)
    let t = GetTimeFromDate(p["date"])
    
    let xoffset = 0
    if (i % 2 == 0) {
      xoffset = -25
    }
    i++
    ctx.drawText(t, new Point(pos+xoffset-10, ctx.size.height-40))
  }
}

function GetTimeFromDate(date) {
  let df = new DateFormatter()
  df.dateFormat = "HH:mm"
  return df.string(date)
}

function GetTimeToNextPoint() {
  let ps = getPoints(travels).filter((p) => {
    return (p.percentage > getProgress())
  })
  let nextDate = ps[0].date
  return ((nextDate - new Date()) * 0.000017)
}
function DrawTimeLabel() {
  ctx.setTextColor(colors[mode].text)
  ctx.setFont(Font.boldSystemFont(100))
  let text = Math.ceil(GetTimeToNextPoint()).toString()
  ctx.drawText(text, new Point(0, 0))
  ctx.setFont(Font.semiboldSystemFont(40))
  ctx.drawText("min", new Point(100*text.length*.7, 60)) // behöver räkna ut width på tid-stringen för att veta var denna ska placeras. Denna formel verkar funka tills vidare.
}

function GetUpcomingStationsThisLeg() {
  let stations = []
  for (travel of travels) {
    if (new Date() < new Date(travel.startDate)) {
      continue
    }
    for (s of travel["details"]["Stops"]) {
      stations.push(s)
    }
  }
  stations = stations.filter((s) => {
    let df = new DateFormatter()
    df.dateFormat = "HH:mm:ss"
    let d = df.string(new Date())
    return d < s.time
  })
  return stations
}
function DrawNextStations() {
  let stations = GetUpcomingStationsThisLeg()
  
  let upcomingPoints = getPoints(travels).filter((p) => {
    return (p.percentage > getProgress())
  })
  
  let stationsUntilPoint = 0
  for (s of stations) {
    if (s == upcomingPoints[0].name) {
      break
    }
    stationsUntilPoint++
  }
  
  ctx.setTextColor(colors[mode].text)
  let x = ctx.size.width/1.9
  ctx.setFont(Font.lightSystemFont(24))
	ctx.drawText("Nästa station", new Point(x, 0))
  ctx.setFont(Font.boldSystemFont(30))
	ctx.drawText(stations[0].name, new Point(x, 30))
	ctx.setTextColor(colors[mode].dimmedText)
  ctx.setFont(Font.lightSystemFont(24))
	ctx.drawText(`${stationsUntilPoint-1} stationer kvar`, new Point(x, 66))
}

async function DrawWaitForLeg() {
  let travel = await CalendarHelper.getUpcomingTravels()
  let d = new Date(travel[0].startDate)
  let df = new DateFormatter()
  df.dateFormat = "HH:mm"
//   let start = new Date(travel[0].startDate)
//   let timeUntilBoarding = Math.round((start - new Date()) * 0.000017)
  let x = ctx.size.width/2
  ctx.setTextColor(colors[Device.isUsingDarkAppearance()].dimmedText)
  ctx.setFont(Font.lightSystemFont(24))
  ctx.drawText("Resan startar", new Point(x, 0))
  ctx.setTextColor(colors[Device.isUsingDarkAppearance()].text)
  ctx.setFont(Font.boldSystemFont(55))
  ctx.drawText(df.string(d), new Point(x,24))
  ctx.setTextColor(colors[Device.isUsingDarkAppearance()].dimmedText)
  ctx.setFont(Font.lightSystemFont(24))
  console.log(travel)
  ctx.drawText(`från ${travel[0].details.Stops[0].name}`, new Point(x, 80))
}