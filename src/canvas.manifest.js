export const manifest = {
  screens: {
    scr_d9af8q: { name: "Content Market Share", route: "/", state: { "activeTab": "market-share" }, position: { "x": 160, "y": 220 } },
    scr_sfedx9: { name: "Viewer Sentiment", route: "/", state: { "activeTab": "sentiment" }, position: { "x": 1560, "y": 220 } }
  },
  sections: {
    sec_s88io0: { name: "Analytics Dashboard", x: 0, y: 0, width: 2920, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_s88io0", children: [
    { kind: "screen", id: "scr_d9af8q" },
    { kind: "screen", id: "scr_sfedx9" }]
  }]

};