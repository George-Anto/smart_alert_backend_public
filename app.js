const express = require("express");
const admin = require("firebase-admin");
const calculator = require("./calculate_distance.js");
const DangerousSituationsGroup = require("./DangerousSituationsGroup");

const app = express();
app.use(express.json());

//The credentials of the Firebase project this app is linked to
const serviceAccount = require("./smartalert-2c301-40e6b229a3b9.json");

//Authenticate this app using the previous credentials
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://smartalert-2c301-default-rtdb.firebaseio.com",
});
//Create the database object
const database = admin.database();
//Create the references that will be used in order to read the reports from the users that are stored in Firebase
const forestFireRef = database.ref("forest_fire_dangerous_situations");
const cityFireRef = database.ref("city_fire_dangerous_situations");
const floodRef = database.ref("flood_dangerous_situations");
const earthquakeRef = database.ref("earthquake_dangerous_situations");
const tornadoRef = database.ref("tornado_dangerous_situations");
const otherRef = database.ref("other_dangerous_situations");

//The references of the tables that this app will write the groups that will be created
const forestFiresGroupsRef = database.ref("forest_fires_groups");
const cityFiresGroupsRef = database.ref("city_fires_groups");
const floodsGroupsRef = database.ref("floods_groups");
const earthquakesGroupsRef = database.ref("earthquakes_groups");
const tornadosGroupsRef = database.ref("tornados_groups");
const othersGroupsRef = database.ref("others_groups");

//The main function of this app
//It creates the groups and then stores them in the correponding table in the database
const writeDangerousSituationsGroupsToDB = function (
	allDangerousSituationsInCategory,
	dangerousSituationsGroups,
	dangerousSituationsGroupsRef
) {
	//For each situation reported in a certain category
	allDangerousSituationsInCategory.forEach((dangerousSituation, i) => {
		//For each dangerous situation, check if is added in a certain group
		let dangerousSituationInserted = false;
		//If this is the first situation, create a new group and add this situation to it
		if (i === 0) {
			const newDangerousSituationGroup = new DangerousSituationsGroup(
				dangerousSituation.timestamp,
				dangerousSituation.date,
				dangerousSituation.time,
				dangerousSituation.latitude,
				dangerousSituation.longitude,
				dangerousSituation.locationAddress,
				dangerousSituation.category
			);
			dangerousSituationsGroups.push(newDangerousSituationGroup);
			//Increment the times this group is reported by 1
			dangerousSituationsGroups[0].incrementReportedTimesBy1(dangerousSituation.uid);
		}
		//If this is not the first situation in the database
		if (i !== 0) {
			//Check what group this situation will be a good fit in be comparing it to all groups
			dangerousSituationsGroups.forEach((dangerousSituationsGroup, i) => {
				let distance = calculator.calcDistance(
					dangerousSituationsGroup.latitude,
					dangerousSituationsGroup.longitude,
					dangerousSituation.latitude,
					dangerousSituation.longitude
				);
				//Get the time difference between this situation and the groups
				//The groups timestamp is the timestamp of the first situation in the group
				const timeSpan = +dangerousSituation.timestamp - +dangerousSituationsGroup.timestamp;

				//We define that in order for an incident to be placed in a group, it must be in a distance
				//lower than 50.000 km from the first reported situation of the group and in a timespan of
				//30 mintutes. If a situation is reported again from the same user, it can not be
				//placed in the same group
				if (
					distance <= 50000 &&
					timeSpan <= 1800000 &&
					!dangerousSituationsGroup.isUserInTable(dangerousSituation.uid)
				) {
					//The situation is added in a group
					dangerousSituationInserted = true;
					dangerousSituationsGroup.incrementReportedTimesBy1(dangerousSituation.uid);
				}
			});
			//If the sistuation does not match the availble groups,
			//create a new group and add it there
			if (!dangerousSituationInserted) {
				const newDangerousSituationGroup = new DangerousSituationsGroup(
					dangerousSituation.timestamp,
					dangerousSituation.date,
					dangerousSituation.time,
					dangerousSituation.latitude,
					dangerousSituation.longitude,
					dangerousSituation.locationAddress,
					dangerousSituation.category
				);
				dangerousSituationsGroups.push(newDangerousSituationGroup);
				newDangerousSituationGroup.incrementReportedTimesBy1(dangerousSituation.uid);
			}
		}
	});

	try {
		//Delete the old data from the database, before writing the new ones
		dangerousSituationsGroupsRef.remove();
		//Store the groups that are created in our database
		dangerousSituationsGroupsRef.set(dangerousSituationsGroups);
		//Log the data for debugging purposes
		// console.log("-------------------------");
		// console.log(dangerousSituationsGroups);
	} catch (error) {
		console.log(error);
	}
};

//ONE LISTENER FOR EVERY DANGEROUS SITUATION TABLE - CATEGORY
//Each time a new entry is written by a user in the corresponding table in the database,
//this method will be executed
forestFireRef.on("value", snapshot => {
	//Read all the data from the table
	const allForestFires = Object.values(snapshot.val());
	// console.log(allForestFires);
	//Create an empty groups array
	const dangerousForestFireSituationsGroups = [];
	//Call the method that creates the groups and writes them in the database
	writeDangerousSituationsGroupsToDB(
		allForestFires,
		dangerousForestFireSituationsGroups,
		forestFiresGroupsRef
	);
});

//Those listeners do exactly the same job as the one above for their corresponding table in the database
cityFireRef.on("value", snapshot => {
	const allCityFires = Object.values(snapshot.val());
	// console.log(allCityFires);
	const dangerousCityFireSituationsGroups = [];

	writeDangerousSituationsGroupsToDB(allCityFires, dangerousCityFireSituationsGroups, cityFiresGroupsRef);
});

floodRef.on("value", snapshot => {
	const allFloods = Object.values(snapshot.val());
	// console.log(allFloods);
	const dangerousFloodSituationsGroups = [];

	writeDangerousSituationsGroupsToDB(allFloods, dangerousFloodSituationsGroups, floodsGroupsRef);
});

earthquakeRef.on("value", snapshot => {
	const allEarthquakes = Object.values(snapshot.val());
	// console.log(allEarthquakes);
	const dangerousEarthquakeSituationsGroups = [];

	writeDangerousSituationsGroupsToDB(
		allEarthquakes,
		dangerousEarthquakeSituationsGroups,
		earthquakesGroupsRef
	);
});

tornadoRef.on("value", snapshot => {
	const allTornados = Object.values(snapshot.val());
	// console.log(allTornados);
	const dangerousTornadoSituationsGroups = [];

	writeDangerousSituationsGroupsToDB(allTornados, dangerousTornadoSituationsGroups, tornadosGroupsRef);
});

otherRef.on("value", snapshot => {
	const allOthers = Object.values(snapshot.val());
	// console.log(allOthers);
	const dangerousOtherSituationsGroups = [];

	writeDangerousSituationsGroupsToDB(allOthers, dangerousOtherSituationsGroups, othersGroupsRef);
});

// Start server
const port = 8080;
app.listen(port, () => {
	console.log(`Server is running on port: ${port}`);
});
