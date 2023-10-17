// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: tasks;
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
console.log(travels)

points = getPoints(travels)
console.log(points)




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




ctx.fillPath()

w.addImage(ctx.getImage()).centerAlignImage()


w.presentMedium()


Script.complete()




function getPoints(data) {
  let points = []
  for (e of data) {
    console.log(e)
    for (date of ["startDate", "endDate"]) {
      let d = new Date(e[date])
      let df = new DateFormatter()
      let color
      if (date == "startDate") {
        color = colors[mode].start
      }
      else if (date == "endDate") {
        color = colors[mode].end
      }
      df.dateFormat = "HH:mm"
      points.push({
        "percentage":((d-startDate) * 0.000017) / ((endDate - startDate) * 0.000017),
        "time":df.string(d),
        "color":color
      })
    }
  }
  return points.slice(1, -1)
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
  
  for (p of points) {
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
  for (p of points) {
    // add points
    let pos = ctx.size.width*p["percentage"]
    ctx.setFillColor(p.color)
    ctx.fillEllipse(new Rect(pos-10, ctx.size.height-20, 20, 20))
    ctx.setTextColor(colors[mode].text)
    ctx.drawText(p["time"], new Point(pos-19, ctx.size.height-40))
  }
}


function GetTimeUntilNextStation() {
  let point = new Date(travels[travels.length-1]["endDate"]).getMilliseconds()
  for (p of points) {
    let d = new Date(p.time)
    if (d > Date()) {
      point = new Date(p)
      break
    }
  }
  console.log(point)
  let date = new Date().getMilliseconds()
  let time_left = point - date

  return (time_left.toString())
}
function DrawTimeLabel() {
  console.log(travels)
  console.log(GetTimeUntilNextStation())
//   const df = new DateFormatter()
//   let d = new Date(endDate - new Date())
//   console.log(d.getMinutes())
  ctx.setTextColor(colors[mode].text)
  ctx.setFont(Font.largeTitle(64))
  ctx.drawText("test", new Point(0, 0))
}