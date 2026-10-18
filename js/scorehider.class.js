/**
 * 
 * TODO 3) Create an Icon for the project
 * 
*/
class ScoreHider{	
	constructor(){
		//******************** DEFINING THE GLOBAL VARIABLES******************************************							
		//IMPORTANT: .stats-block is automatically hidden by css/preoload-hide.css
		//As such it's CRITICALLY IMPORTANT that this file makes it visible again after hiding the scores	
		this.divStatsBlock = document.querySelector(".stats-block");
		this.leftSidebar = document.querySelector(".leftside");
		//Review elements
		this.infoReviewHeader = document.querySelector(".mal-navbar");
		this.scorePlaceholder = "?"; //The text that will replace the scores	
		this.settings = [];

		try{						
			/*
				array of objects containing relevent information about the DOM elements
				related to the scores

				it follows this format:
				element => the DOM element related to the score
					can be either "statsBlock", "leftSide" or "reviewTab"
				value => the ORIGINAL VALUE of the score before being hidden
			
			*/		
			this.scoreDetails = {
				"score":{
						"element": {
							"statsBlock": this.divStatsBlock?.querySelector(".score-label"),
							"leftSide": this.leftSidebar.querySelector(".score-label")
						},
						"value": this.leftSidebar?.querySelector(".score-label").textContent
				},
				"users":{
					"element": {
						//DISCLAIMER: The value is in .fl-l.score "data-user" attribute
						"statsBlock": this.divStatsBlock?.querySelector(".fl-l.score"),
						"leftSide": this.getSidebarElement("users")
					},
					/*In some pages, between the "(scored by" and "x users)" there is an invisible <span> element with a number inside it
					  this hidden <span> causes the "textContent" property to get the wrong number
					  , because it gets ALL of the text of the element and its children, and ends up joining both numbers.

					  therefore, this solution first checks if the element has HTML with the innerHTML property,
					  if it has html, then we can safely use innerText, as it gets all the text RESPECTING visibility definitions.
					*/
					"value": this.getSidebarElement("users")?.innerHTML
								? this.getSidebarElement("users")?.innerText.replace(/[^0-9,-]/g, "") // this extracts only the number
								: this.getSidebarElement("users")?.textContent.replace(/[^0-9,-]/g, "") // this extracts only the number
				},
				"rank":{
					"element": {
						"statsBlock": this.divStatsBlock?.querySelector(".numbers.ranked strong"),
						"leftSide": this.getSidebarElement("ranked")

					},
					"value": this.getSidebarElement("ranked")?.textContent
				},
				"popularity":{
					"element": {
						"statsBlock": this.divStatsBlock?.querySelector(".numbers.popularity strong"),
						"leftSide": this.getSidebarElement("popularity")
					},
					"value": this.getSidebarElement("popularity")?.textContent
				},
				"members":{
					"element": {
						"statsBlock": this.divStatsBlock?.querySelector(".numbers.members strong"),
						"leftSide": this.getSidebarElement("members")
					},
					"value": this.getSidebarElement("members")?.textContent
				},
				//DISCLAIMER: the "favorites" stat is only shown in the left side bar
				"favorites":{
					"element": {
						"leftSide": this.getSidebarElement("favorites")
					},
					"value": this.getSidebarElement("favorites")?.textContent
				},
				//REVIEW STATS
				"recommended": {
					"element": {
						"reviewTab":this.infoReviewHeader?.querySelector(".recommended strong")
					},
					"value": this.infoReviewHeader?.querySelector(".recommended strong").textContent
				},
				"mixed": {
					"element": {
						"reviewTab": this.infoReviewHeader?.querySelector(".mixed-feelings strong")
					},
					"value": this.infoReviewHeader?.querySelector(".mixed-feelings strong").textContent
				},
				"not_recommended": {
					"element": {
						"reviewTab": this.infoReviewHeader?.querySelector(".not-recommended strong")
					},
					"value": this.infoReviewHeader?.querySelector(".not-recommended strong").textContent
				},
				"review_amount": {
					"element": {
						"reviewTab": this.infoReviewHeader?.querySelector(".right strong")
					},
					"value": this.infoReviewHeader?.querySelector(".right strong").textContent
				},
				"ratio_bar": {
					"element": {
						"reviewTab": this.infoReviewHeader?.querySelector(".review-ratio__bar")
					}
				},

			};

		    console.log("scoreDetails");
			console.log(this.scoreDetails);
		    this.start();
		}catch(error){
			console.error(`${error}`);			
		}
		
		
	}	
	
	//sets up the system to start the score hiding process
	async start(){				
		// await browser.storage.sync.clear(); //Wipes all storage, THIS IS MEANT FOR TESTS *ONLY*.

		//retrieves all storage data and then throws an error, THIS IS MEANT FOR TESTS *ONLY*
		// console.log("Testing storage"); console.log(await this.getAllStorage()); throw new Error("Testing");
		try{
			this.settings = await this.getSettings(); //retrieving settings

			//If there was an error while retrieving the settings, thrown an error
			if(this.settings?.error)
				throw Error(`start(): There was an error while trying to retrieve settings from storage (${this.settings.error})`);

			//If there was no error, but we still didn't get the settings, then it means it's the first time the extension
			//is being run.
			if(!this.settings?.hide || !this.settings?.show){
				console.log("Couldn't find settings data.\nStoring settings for the first time.");
				let result = await this.setSettingsFirstUse(); //sets the settings for first time

				if(result.success)
					this.settings = result.dataStored; //if the data was stored, then just assign it to this.settings
				else
					throw Error(`start(): Error when storing settings for the first time (${result?.error})`);
			}
			console.log("settings");
			console.log(this.settings);

			this.defineStatsVisibility(this.settings); //starts the hiding/showing proccess based on the settings

			this.startListeners(); //Initialize the listeners
		}catch(error){
			console.error(error);
		}finally{
			console.log("reverting pre-load hide");
			//making the elements hidden the preload-hide.css visible again
			if(this.divStatsBlock)
				this.divStatsBlock.style.opacity = "1";
			if(this.leftSidebar)
				this.leftSidebar.style.opacity = "1";
			if(this.infoReviewHeader)
				this.infoReviewHeader.style.opacity = "1";
		}
	}

	//only for debugging, returns all values in storage
	getAllStorage(){
		return browser.storage.sync.get(null).then(data => console.log(data));
	}

	//searches for the scorehider_settings in storage, and returns what it finds
	getSettings(){
		//browser.storage.sync.get("scorehider_settings")
		//Promise.reject(new Error("Simulated error2"))
		return browser.storage.sync.get("scorehider_settings").then(
			(value)=> value?.scorehider_settings,
		).catch(
			(error)=>{return {error}}
		);
	}

	//stores the settings in storage, and returns an object that tells if the storage process failed or succeeded
	/*
	 * RETURN EXAMPLES:
	 * {
	 * 	"success": true,
	 *  "error": undefined
	 * }
	 *
	 * {
	 * 	"success": false,
	 *  "error": Error
	 * }
	 */
	async setSettings(scorehider_settings){
		//browser.storage.sync.set({scorehider_settings})
		//Promise.reject(new Error("Simulated error2"))
		let success = false;			
		let errorMsg = undefined;
		await browser.storage.sync.set({scorehider_settings}).then(
			()=>{
				console.log("stored settings succesfully");
				success = true;
			}
		).catch(
			(error)=>{
				errorMsg = error;
			}
		);
		return {"success": success, "error": errorMsg};
	}

	//stores the settings if there isn't any stored.
	//it returns the result of this.setSettings(), but if it succeeds a value "dataStored" is attached.
	/*
	 * RETURN EXAMPLES:
	 * {
	 * 	"success": false,
	 *  "error": Error
	 * }
	 *
	 * {
	 * 	"success": true,
	 *  "error": undefined,
	 *  "dataStored": [{"action": "hide", "list": [...]},{"action": "show", "list": [...]}]
	 * }
	 *
	 */
	async setSettingsFirstUse(){

		//creating list that we're going to store
		let dataToStore = [
			{"action": "hide", "list": Object.keys(this.scoreDetails)},//by default we hide every single stat
			{"action": "show", "list": []},
		];

		let result = await this.setSettings(dataToStore); //storing settings
		if(result.success)
			result.dataStored = dataToStore;

		return result;
	}


	//Iterates through the settings and call the appropriate methods for setting the score visibility
	defineStatsVisibility(settings = this.settings){
		//itarating through each value of settings
		//settings is only supposed to have 2 values max, so I don't see a problem in making a multilayered "for" statement
		for(let setting of settings){
			let statList = setting.list;
			console.log(`defineStatsVisibility(): STARTING ${setting.action.toUpperCase()}`)

			//iterating through the entire list defined in the setting, making sifferent actions depending on the setting.action
			for(let statName of statList){
				try{
					let stat = this.scoreDetails[statName];
					if(stat.element){
						console.log(`defineStatsVisibility(): ${setting.action} "${statName}"`);

						//setting up the value that we're gonna set to the stat
						let newValue;
						if(setting.action == "hide")
							newValue = (statName == "ratio_bar") ? "hidden" : this.scorePlaceholder;
						else if(setting.action == "show")
							newValue = (statName == "ratio_bar") ? "visible" : this.scoreDetails[statName].value;

						//calling each function to set the score
						//STATS BLOCK
						if(stat.element.statsBlock)
							this.updateStatsBlockScore(statName, newValue);
						//LEFT SIDE
						if(stat.element.leftSide)
							this.updateLeftSideScore(statName, newValue);
						//REVIEWS
						if(stat.element.reviewTab)
							this.updateReviewStat(statName, newValue);

					}else{
						console.log(`defineStatsVisibility(): ${setting.action} "${statName}" failed because "${statName}" is undefined. Ignoring.`);
					}
				}catch(error){
					console.error(`defineStatsVisibility(): ${setting.action} "${statName}" threw an error`);
					console.error(error);
				}
			}
		}
		console.log("defineStatsVisibility(): FINISHED");
	}
	/*
		Updates the visibility of elements from the STATS BLOCK
		Receives the statName and the value that's going to be set in the stat's element
	*/
	updateStatsBlockScore(statName, newValue){
		let statElement = this.scoreDetails[statName].element.statsBlock;
		newValue = newValue.replace("\n", "").trim(); //removing spaces and "\n" from the newValue so the statsBlock won't change
		if(statName == "users")
			statElement.setAttribute("data-user", `${newValue} users`);
		else
			statElement.replaceChildren(newValue);
	}

	/*
	    Updates the visibility of elements from the LEFT SIDE BAR
		Receives the statName and the value that's going to be set in the stat's element
	*/
	updateLeftSideScore(statName, newValue){
		let statElement = this.scoreDetails[statName].element.leftSide;
		switch(statName){
			case "users":
				//The first if is for when the text node is COMPLETE
				//e.g: #text: "(scored by 200 users)"
				//the else is for when the text node is separated
				//e.g: #text: "(scored by " | #text: "200 users)" <-- the one we're altering
				if(statElement.textContent.includes("(scored by"))
					statElement.textContent = `\n(scored by ${newValue} users)\n`;
				else
					statElement.textContent = `${newValue} users)\n`;
				break;
			case "score":
				statElement.textContent = newValue;
				break;
			case "rank":
				statElement.textContent = `\n ${newValue}`;
				break;
			default:
				statElement.textContent = `\n ${newValue}\n`;
		}

	}

	/*
	 * Updates the visibility of elements from the REVIEW STATS BAR
	   Receives the statName and the value that's going to be set in the stat's element*
	 */
	updateReviewStat(statName, newValue){
		let statElement = this.scoreDetails[statName].element.reviewTab;
		if(statName == "ratio_bar")
			statElement.style.visibility = newValue;
		else
			statElement.textContent = newValue;
	}

	//get the element of the stat from the left side bar
	getSidebarElement(elementName) {
		elementName = elementName.toLowerCase(); //putting the parameter in lowercase

		//getting a list of all .spaceit_pad from the left side bar
		let leftElements = Array.from(this.leftSidebar.querySelectorAll(".spaceit_pad"));

		/*
		getting the <div> that has the value informed in the parameter
		All of the score DOM elements on the left side bar have the .spaceit_pad
		But none of them  have any unique class or id to help us run a querySelector on each one

		Therefore, to get the value we need, we need to filter the elements specifically by the
		text present in the <span> element inside .spaceit_pad.

		Not the prettiest solution but it's all that I could figure out,
		if you're reading this, I'm open for suggestions.
		*/
		let element;
		if(elementName == "users"){
			//The "users" and "score" tabs are in the same parent element
			//so if we are trying to get the users, we can just call the element directly			
			element = this.leftSidebar.querySelector("[data-id=info1]");			
		}else{
			element = leftElements.filter((e)=>{													
				/*
				Takes each text in .spaceit_pad 's <span> element and does this:
				1) get the value in lowercase
				2) removes ":" from the string
				3) compare the final string with the parameter elementName

				E.g 
					"Ranked:" -> "ranked:" -> "ranked"		
					and if elementName == "ranked" then the var "element" receives that DOM element
				*/
				return elementName == e.querySelector("span").textContent.toLowerCase().replace(":", "");
			});		
			element = element[0];
		}		

		//code below is only run if the element isn't undefined
		if(element){
			try{
				//getting the element that has the stat we need			
				let value = Array.from(element.childNodes).filter((node)=>{				
					if(elementName == "users"){					
						//since the SCORE and USERS stats are in the same div, we need to be more specific
						//when calling for the "users" stat							
						return node.nodeType == 3 
						       && node.textContent.includes("users");
					}else{
						return node.nodeType == 3 
						       && node.textContent.replace("\n", "").trim();	
					}									  
				});						
				
				/**
				 * If we didn't manage to get a value for the USERS stat in the last code, it's because
				 * the stat we want is inside a <small> element
				 * 
				 * Basically, on /anime pages, the "(scored by x users)" text is loose in the <div>
				 * However on /manga pages (Including light novels) it is inside a <small> element
				 * 
				 * Therefore, the code below intends to extract the "users" stat from /manga pages
				*/
				if(elementName == "users" && value.length == 0){
					value = Array.from(element.querySelectorAll("small")).filter((e)=>{
	    				return e.textContent.includes("users")
					}); 				
				}						
							
				return value[0];	
			}catch(error){
				console.error(`ERROR: getSidebarElement() error when trying to retrieve "${elementName}" (${error})`);
			}
		}
		//if the element is undefined, return null
		//most likely an invalid elementName was informed 
		return null;
		
	}


	//Starts the listener of the scoreHider, this is intended for when the user interacts with the settings.
	startListeners(){

		document.addEventListener("keydown", (e)=>{
			//TODO URGENT!! REMOVE THIS LISTENER IN THE FINAL RELEASE
			//this listener is for debugging purposes ONLY. It HAS to be removed in the final release, otherwise issues could arise
			switch(e.key){
				case "h":
					this.defineStatsVisibility([{"action": "hide", "list": Object.keys(this.scoreDetails)}]);
					break;
				case "s":
					this.defineStatsVisibility([{"action": "show", "list": Object.keys(this.scoreDetails)}]);
					break;
				case "b":
					this.defineStatsVisibility([
						{"action": "hide", "list": Object.keys(this.scoreDetails)},
						{"action": "show", "list": Object.keys(this.scoreDetails)}
					]);
					break;
			}
		});
	}
}

//instantiating the ScoreHider class, making it execute the commands.
let score = new ScoreHider();


