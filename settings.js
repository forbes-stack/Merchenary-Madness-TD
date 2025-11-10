function settingsDraw() {
  //56,34,0
  //74,45,0
  //107,65,0
  fill(107,65,0)
  strokeWeight(5)
  stroke(74,45,0)
  settings_header = rect(200,50,300,100, 10)
  settings_body = rect(50,200,600,400, 10)

  fill('white')
  strokeWeight(1)
  stroke('white')

  textSize(50)
  textFont('cursive')

  text('Settings', 253,115)

  textSize(40)
  text('Global Volume:', 75, 300)
  text('SFX:', 75, 400)


  

  
}