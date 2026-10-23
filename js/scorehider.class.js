/**
 * 
 * TODO Create an Icon for the project
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
							"leftSide": this.leftSidebar?.querySelector(".score-label")
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
								? this.getSidebarElement("users")?.innerText.replace(/[^0-9,-]/g, "") // this extracts only the numbers, "-" and ","
								: this.getSidebarElement("users")?.textContent.replace(/[^0-9,-]/g, "") // this extracts only the numbers, "-" and ","
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

			//seasonal tab, it also refers to other pages like manga/magazine/282/Shounen_Champion_Monthly for example
			this.seasonalTab = document.querySelector(".js-categories-seasonal");
			this.seasonalTabElements = {}; //will store the stats and other information of ALL anime entries in the seasonal anime page.
			if(this.seasonalTab){
				//a seasonal anime page has many "blocks" for each anime entry. These blocks have the class .seasonal-anime (even for manga)
				//therefore we need to iterate through EVERY block and store the stats.
				let elements = this.seasonalTab.querySelectorAll(".seasonal-anime");
				for(let element of elements){
					try{
						//with this we get the ID of the anime/manga itself. This will be used as an identifier when storing the stats.
						let animeId = element.querySelector(".genres.js-genre").id;
						if(!animeId){
							console.error("ERROR: Could not find the id of the anime element.\nIgnoring element");
							console.log(element);
							continue;
						}

						//the "skeleton" of each object that will be stored in this.seasonalTabElements
						let seasonalTabValues = {
							"score": {
								"value": undefined,
								"element": undefined
							},
							"members": {
								"value": undefined,
								"element": undefined
							}
						};


						//the next two expressions get the TEXT NODE where the "score" and "members" stats are stored
						//we sadly cannot gather the DOM element itself, as these values have a <i> tag inside them, making it impossible
						//for us to replace the stats value with innerText or textContent without removing the <i> tag

						//by using a text node, we guarantee that we are altering ONLY the text value

						//REGEX: gets the text node that has numbers [0-9] OR the exact text "N/A"
						seasonalTabValues.score.element = Array.from(element.querySelector(".scormem-item.score").childNodes)
																.filter((node)=>/[0-9]|N\/A/g.test(node.textContent))[0];

						seasonalTabValues.members.element = Array.from(element.querySelector(".scormem-item.member").childNodes)
															.filter((node)=>/[0-9]|N\/A/g.test(node.textContent))[0];

						//getting the value of the scores
						seasonalTabValues.score.value = seasonalTabValues.score.element?.textContent.replace("\n", "").trim();
						seasonalTabValues.members.value = seasonalTabValues.members.element?.textContent.replace("\n", "").trim();

						//storing the object into this.seasonalTabElements, using the anime id as an identifier
						this.seasonalTabElements[animeId] = seasonalTabValues;
					}catch(error){
						console.error(error);
						console.log(element);
					}
				}
			}



			console.log("seasonalTab");
			console.log(this.seasonalTab);

			console.log("seasonalTabElements");
			console.log(this.seasonalTabElements);

			console.log("seasonalTabElements size");
			console.log(Object.keys(this.seasonalTabElements).length);

		    console.log("scoreDetails");
			console.log(this.scoreDetails);

		    this.start();
		}catch(error){
			console.error(error);
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
			if(this.settings == undefined || this.settings == null){
				console.log("Couldn't find settings data.\nStoring settings for the first time.");
				let result = await this.setSettingsFirstUse(); //sets the settings for first time

				if(result.success)
					this.settings = result.dataStored; //if the data was stored, then just assign it to this.settings
				else
					throw Error(`start(): Error when storing settings for the first time (${result?.error})`);
			}
			console.log("settings");
			console.log(this.settings);

			//starts the hiding/showing proccess based on the settings
			if(this.seasonalTab)
				this.setSeasonalAnimeStatsVisibility(this.settings);
			else
				this.setAnimePageStatsVisibility(this.settings);

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

			if(this.seasonalTab)
				this.seasonalTab.style.opacity = "1";
		}
	}

	//only for debugging, returns all values in storage
	getAllStorage(){
		return browser.storage.sync.get(null).then(data => data);
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
		let dataToStore = Object.keys(this.scoreDetails);//by default we hide every single stat

		let result = await this.setSettings(dataToStore); //storing settings
		if(result.success)
			result.dataStored = dataToStore;

		return result;
	}


	//Iterates through the settings and call the appropriate methods for setting the score visibility
	setAnimePageStatsVisibility(hideList = [], showList = []){
		let fullList = [
			{"action": "hide", "list":hideList},
			{"action": "show", "list":showList}
		];
		//itarating through each value of fullList
		//settings is only supposed to have 2 values max, so I don't see a problem in making a multilayered "for" statement
		for(let currentList of fullList){
			let statList = currentList.list;
			console.log(`setAnimePageStatsVisibility(): STARTING ${currentList.action.toUpperCase()}`);

			//iterating through the entire list defined in the currentList, making sifferent actions depending on the currentList.action
			for(let statName of statList){
				try{
					let stat = this.scoreDetails[statName];
					if(stat.element){
						console.log(`setAnimePageStatsVisibility(): ${currentList.action} "${statName}"`);

						//setting up the value that we're gonna set to the stat
						let newValue;
						if(currentList.action == "hide")
							newValue = (statName == "ratio_bar") ? "hidden" : this.scorePlaceholder;
						else if(currentList.action == "show")
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
						console.log(`setAnimePageStatsVisibility(): ${currentList.action} "${statName}" failed because "${statName}" is undefined. Ignoring.`);
					}
				}catch(error){
					console.error(`setAnimePageStatsVisibility(): ${currentList.action} "${statName}" threw an error`);
					console.error(error);
				}
			}
		}
		console.log("setAnimePageStatsVisibility(): FINISHED");
	}

	//sets the visibility of "score" and/or "members" in the seasonal anime page
	//it also works with manga magazine lists.
 	setSeasonalAnimeStatsVisibility(hideList = [], showList = []){

		//making an array of all anime ids that were stored in this.seasonalTabElements
		let seasonalIds = Object.keys(this.seasonalTabElements);

		//defining the "function" that we're going to run for hiding the elements
		let scoreVisibility = (ids, statList, action) =>{
				console.log(`setSeasonalAnimeStatsVisibility(): STARTING TO ${action.toUpperCase()} THE ELEMENTS`);
				//TODO: This is a pretty heavy iteration. For example: If there's 300 anime entries in the fall 2010 page, then this will run
				//300 times. Each time we try to hide or show the elements, it'll run 300 times.
				//I tried my best to make it concise, but I don't know if there could be possible performance issues.
				//since it works just fine for me, I'll just proceed with the development normally, but this sections must be closely monitored.
				for(let id of ids){
					//in the seasonal anime screen, the only stats are "score" and "members"
					for(let stat of ["score", "members"]){
						try{
							//define if we're going to HIDE or SHOW the stat
							if(statList.includes(stat))
								this.seasonalTabElements[id][stat].element.textContent = action == "hide"
																						? this.scorePlaceholder
																						: this.seasonalTabElements[id][stat].value;
						}catch(error){
							console.error(`setSeasonalAnimeStatsVisibility(): There was an error while trying to ${action.toUpperCase()} the ${stat.toUpperCase()} of the anime/manga id ${id}`);
							console.error(error);
							break;
						}
					}
				}
				console.log(`setSeasonalAnimeStatsVisibility(): FINISHED "${action.toUpperCase()}"`);
		}

		//this is a bit ugly, but honestly, who cares?
		//way better than having 3 nested for loops
		if(hideList.length > 0)
			scoreVisibility(seasonalIds, hideList, "hide");
		if(showList.length > 0)
			scoreVisibility(seasonalIds, showList, "show");

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
		//if we're not in anime/manga page, the left side bar doesn't exist therefore we need to make this function return undefined
		//to prevent errors
		if(!this.leftSidebar)
			return undefined;

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
		//TODO URGENT!! REMOVE THIS LISTENER IN THE FINAL RELEASE
		//this listener is for debugging purposes ONLY. It HAS to be removed in the final release, otherwise issues could arise
		// document.addEventListener("keydown", (e)=>{
		// 	switch(e.key){
		// 		case "h":
		// 			this.setAnimePageStatsVisibility(Object.keys(this.scoreDetails));
		// 			break;
		// 		case "s":
		// 			this.setAnimePageStatsVisibility([]);
		// 			break;
		// 		case "b":
		// 			this.setAnimePageStatsVisibility(["score", "favorites"]);
		// 			break;
		// 	}
		// });

		//STORAGE UPDATE LISTENER
		//this listener will be triggered as soon as a value in the popup is checked/unchecked
		browser.storage.sync.onChanged.addListener((changes)=>{
			if(changes.scorehider_settings){
				let oldValue = changes.scorehider_settings.oldValue;
				let newValue = changes.scorehider_settings.newValue;

				console.log("change old value");
				console.log(oldValue);
				console.log("change new value");
				console.log(newValue);

				//The code below makes sure we'll only act upon the elements that were added/removed
				//otherwise this.setAnimePageStatsVisibility would trigger a "show" command for every single element that wasn't hidden, or
				//trigger a "hide" for every single element that wasn't shown.

				//Getting all values from the newList that AREN'T in the old list
				let hideList = newValue.filter((value)=>!oldValue.includes(value));

				//Getting all values from the oldList that AREN'T in the new list
				let showList = oldValue.filter((value)=>!newValue.includes(value));

				if(this.seasonalTab){
					//this makes sure the arguments are either "score" or "members", or both
					hideList = hideList.filter((value)=>value=="score"||value=="members");
					showList = showList.filter((value)=>value=="score"||value=="members");
					this.setSeasonalAnimeStatsVisibility(hideList, showList);
				}else{
					this.setAnimePageStatsVisibility(hideList, showList);
				}

				//just logging this as an object so it's more convenient to compare hideList with showList
				console.log("hidelist + showlist");
				console.log({
					"hidelist": hideList,
					"showlist": showList
				});

				this.settings = newValue;

			}
		})
	}
}

//instantiating the ScoreHider class, making it execute the commands.
let score = new ScoreHider();
