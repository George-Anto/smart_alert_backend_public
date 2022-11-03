//The instances of this class represent some dangerous situations post by users
//that are grouped as the same situation from the time and place that are reported
class DangerousSituationsGroup {
	constructor(timestamp, date, time, latitude, longitude, locationAddress, category) {
		this.timestamp = timestamp;
		this.date = date;
		this.time = time;
		this.latitude = latitude;
		this.longitude = longitude;
		this.locationAddress = locationAddress;
		this.category = category;
		//How many times the situation has been reported in total
		this.numberOfTimesReported = 0;
		//The id's of the user's that reported the group
		this.totalUsersThatReportedTheGroup = [];
		//The level of the alert
		this.alertLevel = "Level 0";
	}

	//Increment the total times reported and add the user's id that reported the situation to the list
	incrementReportedTimesBy1(uid) {
		this.numberOfTimesReported++;
		this.totalUsersThatReportedTheGroup.push(uid);
		//Calculate the level of the alert based on the total reports number
		this.calculateAlertLevel();
	}

	//Each user can report a situation that is in a group only once
	//If the user has not reported the situation in the past, then the new report will be added to the group
	isUserInTable(uid) {
		const found = this.totalUsersThatReportedTheGroup.find(element => element === uid);
		if (found) return true;
		else return false;
	}

	//Calculate the alert level based on the number of the total reports of this group
	calculateAlertLevel() {
		if (this.numberOfTimesReported >= 1 && this.numberOfTimesReported <= 2) {
			this.alertLevel = "Level 1";
			return;
		}
		if (this.numberOfTimesReported >= 3 && this.numberOfTimesReported <= 5) {
			this.alertLevel = "Level 2";
			return;
		}
		if (this.numberOfTimesReported >= 6 && this.numberOfTimesReported <= 9) {
			this.alertLevel = "Level 3";
			return;
		}
		if (this.numberOfTimesReported >= 10) {
			this.alertLevel = "Level 4";
			return;
		}
	}
}

module.exports = DangerousSituationsGroup;
