// script.js

// global variables
var data;     // parsed data object containing all necessary information 
var indexSet; // set containing installed packages

// give data a value for testing
data = {
	"packageB": {
		"name": "packageB",
		"description": "anotherDescription",
		"dependencies": ["packageBB", "packageBC", "packageA"],
		"reverseDependencies": ["revdep1"]
	},
	"packageA": {
		"name": "packageA",
		"description": "aDescription",
		"dependencies": ["packageAB", "packageAC"],
		"reverseDependencies": ["revdep1", "packageB"]
	}
};

// set event listener for uploading the poetry.lock file
const inputElement = document.getElementById("file-input");
inputElement.addEventListener("change", handleFileAndBuildIndex, false);
//
// utility function for partial application
const partial = (fn, firstArg) => {
	return (...lastArgs) => {
		return fn(firstArg, ...lastArgs);
	}
};

/*
function waitToBuildIndex() {
	if(poetryFileString) {
		buildIndex(poetryFileString);
	} else {
		setTimeout(waitToBuildIndex, 500);
	}
}
*/

function handleFileAndBuildIndex(event) {
	const input = event.target;
	if ('files' in input && input.files.length > 0) {
    const poetryFileString = saveFileContent(input.files[0]);
	  //data = parse(poetryFileString); // save parsed data in global variable
	  indexSet = new Set(Object.keys(data)); // set containing index entries in global variable
		buildIndex();
  }
}

function saveFileContent(file) {
  readFileContent(file).then(content => {
    return content;
  }).catch(error => console.log(error))
}

function readFileContent(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = event => resolve(event.target.result);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  })
}

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
	addReverseDependencies(newContent, packageName);

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

