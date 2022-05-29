// script.js

//
// SETUP
//

// global variables
var data;     // parsed data object containing all necessary information 
var indexSet; // set containing the names of installed packages

// utility function for partial application
const partial = (fn, firstArg) => {
	return (...lastArgs) => {
		return fn(firstArg, ...lastArgs);
	}
};

// set event listener for uploading the poetry.lock file
const inputElement = document.getElementById("file-input");
inputElement.addEventListener("change", handleFileAndBuildIndex, false);


// 
// FILE UPLOAD
//
async function handleFileAndBuildIndex(event) {
	const input = event.target;
	if ('files' in input && input.files.length > 0) {
    const poetryFileString = await readFileContent(input.files[0]);
   // console.log("poetryFileString: ", poetryFileString);
	  data = parser(poetryFileString, 0, {}); // global variable
	  indexSet = new Set(Object.keys(data));  // global variable
		buildIndex();
  }
}

/*
function saveFileContent(file) {
  readFileContent(file).then(content => {
    return content;
  }).catch(error => console.log(error))
}
*/

function readFileContent(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = event => {console.log(event.target.result); resolve(event.target.result); };
    //reader.onload = event => resolve(event.target.result);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  })
}

//
// VIEW BUILDERS
//
function buildIndex() {
	const content = document.getElementById("content");
	let newContent = document.createElement("div");
	newContent.setAttribute("id","content");
	const index = document.createElement("figure");
	const indexCaption = document.createElement("figcaption");
	indexCaption.appendChild(document.createTextNode("Dependencies"));
	const list = document.createElement("ul");
	Object.keys(data).sort().forEach( packageName => {
		const newItem = document.createElement("li");
		let newLink = document.createElement("a");
		newLink.setAttribute("href","#!");
		newLink.appendChild(document.createTextNode(packageName));
		newLink.addEventListener("click", partial(buildPage, packageName), false);
		newItem.appendChild(newLink);
		list.appendChild(newItem);
	});
	index.appendChild(indexCaption);
	index.appendChild(list);
	newContent.appendChild(index);
	document.body.replaceChild(newContent, content);
}

function buildPage(packageName) {
	const content = document.getElementById("content");
	let newContent = document.createElement("div");
	newContent.setAttribute("id","content");
	
	// these functions append new elements to newContent
	addIndexLink(newContent);
	addTitle(newContent, packageName);
	addDescription(newContent, packageName);
	addDependencies(newContent, packageName);
	//addReverseDependencies(newContent, packageName);

	document.body.replaceChild(newContent, content);
}

function addIndexLink(newContent) {
	let indexLink = document.createElement("a");
	indexLink.appendChild(document.createTextNode("< Back to index"));
  indexLink.addEventListener("click", buildIndex, false);
  indexLink.setAttribute("href","#!");
  newContent.appendChild(indexLink);
}

function addTitle(newContent, packageName) {
	let title = document.createElement("h1");
	title.appendChild(document.createTextNode(packageName));
	newContent.appendChild(title);
}

function addDescription(newContent, packageName) {
	let desc = document.createElement("p");
	desc.appendChild(document.createTextNode(data[packageName].description));
	newContent.appendChild(desc);
}	

function addDependencies(newContent, packageName) {
	const deps = document.createElement("figure");
	const depsCaption = document.createElement("figcaption");
	depsCaption.appendChild(document.createTextNode("Dependencies"));
	const list = document.createElement("ul");
	data[packageName].dependencies.forEach( dependencyName => {
		newItem = document.createElement("li");
		let newLink = document.createElement("a");
		if( indexSet.has(dependencyName) ) {
			newLink.setAttribute("href","#!");
			newLink.addEventListener("click", partial(buildPage, dependencyName), false);
		}
		newLink.appendChild(document.createTextNode(dependencyName));
		newItem.appendChild(newLink);
		list.appendChild(newItem);
	});
	deps.appendChild(depsCaption);
	deps.appendChild(list);
	newContent.appendChild(deps);
}

function addReverseDependencies(newContent, packageName) {
	const revDeps = document.createElement("figure");
	const revDepsCaption = document.createElement("figcaption");
	revDepsCaption.appendChild(document.createTextNode("Reverse dependencies"));
	const list = document.createElement("ul");
	data[packageName].reverseDependencies.forEach( dependencyName => {
		newItem = document.createElement("li");
		let newLink = document.createElement("a");
		if( indexSet.has(dependencyName) ) {
			newLink.setAttribute("href","#!");
			newLink.addEventListener("click", partial(buildPage, dependencyName), false);
		}
		newLink.appendChild(document.createTextNode(dependencyName));
		newItem.appendChild(newLink);
		list.appendChild(newItem);
	});
	revDeps.appendChild(revDepsCaption);
	revDeps.appendChild(list);
	newContent.appendChild(revDeps);
}

//
// PARSER
//
function packageIndices(textString) {
	let endIdx = textString.indexOf("[package.dependencies]");
	if (endIdx === -1) { endIdx = textString.indexOf("[package.extras]") };
	if (endIdx === -1) { endIdx = textString.length };
	return [0, endIdx];
}

function packageParser(textString) {
	[startIdx, endIdx] = packageIndices(textString);
	let segment = textString.slice(startIdx,endIdx);
	//matching
	let nameMatch = segment.match(/\bname\s*=\s*"(\S+)"/);
	let name;
	if(nameMatch === null) { name = null } else { name = nameMatch[1]; }
	let descMatch = segment.match(/\bdescription\s*=\s*"([^"]+)"/);
	let description;
	if(descMatch === null ) { description = "" } else { description = descMatch[1] };
	return [name, description];
}

function dependenciesIndices(textString) {
	let startIdx = textString.indexOf("[package.dependencies]",0);
	if (startIdx === -1) { return [-1, -1] }; // not found
	if (startIdx === -1) { return [] };
	startIdx += "[package.dependencies]".length;
	let endIdx = textString.indexOf("[package.extras]",startIdx); // check for bugs!
  if (endIdx === -1) { endIdx = textString.length; };
  return [startIdx, endIdx];
}

function dependenciesParser(textString) {
	[startIdx, endIdx] = dependenciesIndices(textString);
	if(startIdx === -1 && endIdx === -1) {return []};
	let segment = textString.slice(startIdx, endIdx);
	// matching
	let re = /\n\b(\S+)\s*=/g;
  let deps = Array.from(segment.matchAll(re), m => m[1]);
  return deps;
}

function extrasIndices(textString) {
	let startIdx = textString.indexOf("[package.extras]",0);
	if (startIdx === -1) { return [-1, -1] }; // not found
	startIdx += "[package.extras]".length;
  let endIdx = textString.indexOf("\n[", startIdx);
  if (endIdx === -1) { endIdx = textString.length; };
  return [startIdx, endIdx];
}

function extrasParser(textString) {
	[startIdx, endIdx] = extrasIndices(textString);
	if(startIdx === -1 && endIdx === -1) {return []};
	let segment = textString.slice(startIdx, endIdx);
	// matching
	let re = /"([^"]+)"/g;
  let extraDepsWithVersions = Array.from(segment.matchAll(re), m => m[1]);
  let extraDeps = extraDepsWithVersions.map(s => s.split(" ")[0]);
  return extraDeps;
}

function parser(fileString, idx, value) {
	if(idx >= fileString.length-1) { return value; }
	
	let startIdx = fileString.indexOf("[[package]]",idx);
	if (startIdx === -1) { return value; };
	startIdx += "[[package]]".length;
	let endIdx = fileString.indexOf("[[package]]",startIdx); // check for bugs!
	if (endIdx === -1) { endIdx = fileString.length };
	let segment = fileString.slice(startIdx, endIdx);
	
	let [name, description] = packageParser(segment);
	let regularDeps = dependenciesParser(segment);
	let extraDeps = extrasParser(segment);
	let dependencies = [ ...new Set( [...regularDeps, ...extraDeps ] ) ].sort();

	value[name] = {
		"description": description,
		"dependencies": dependencies
	};
		
	return parser(fileString, endIdx, value);
}
