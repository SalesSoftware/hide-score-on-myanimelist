/*
 * 
 * TODO Create an Icon for the project
 * 
*/

/**
 *
 * This class has the duty of hiding all the scores that the user wants it to hide, across (most) pages that has score stats defined
 */
class ScoreHider{	
	/**
	 * Sets up the variables that will be used in the rest of the class, and then calls {@link start()}
	 * @constructor
	 */
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
			this.storageSync = new StorageSync(); //from js/storageSync.class.js
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
			//some LIST VIEWS also have the class ".js-categories-seasonal" with ".seasonal-anime" elements inside it, so to get the true SEASONAL
			//view we need to filter by the ones that has ".seasonal-anime" but are NOT ".list".
			//Resulting in ".js-categories-seasonal:has(.seasonal-anime):not(.list)"
			this.seasonalViewContainer = document.querySelector(".js-categories-seasonal:has(.seasonal-anime):not(.list)");

			//refers to the LIST VIEW of the anime/manga pages. For example: https://myanimelist.net/anime.php?cat=anime&q=anime
			//The LIST VIEW of the Producers's page has ".js-categories-seasonal.list" class instead of ".js-block-list.list".
			//So I added both rules to the querySelector, in a way that it will get either one.
			//Hopefully we don't have a page that has both classes though... :,)
			this.listViewContainer = document.querySelector(".js-block-list.list, .js-categories-seasonal.list");
			this.animeViewElements = {}; //will store the stats and other information of ALL anime entries in the seasonal/list anime page.
			if(this.seasonalViewContainer || this.listViewContainer){
				//a seasonal/list anime page has many "blocks" for each anime/manga entry.
				//therefore we need to iterate through EVERY block and store their stats in a variable, before hiding the elements.
				let elements;

				//these variables are used in LIST VIEWS
				let indexScore, indexMembers;
				//LIST VIEWS of the producer pages follow different rules from the other list views
				//so we use this boolean variable to know if we're at a producer's page or not.
				//P.S: the rule takes all tr elements that has the "js-anime-category" string ANYWHERE in the classlist of the element.
				//This is because this class usually shows up in the produce page as "js-anime-category-licensor", "js-anime-category-studio"
				//or js-anime-category-producer
				//"!!" just converts the querySelector result into boolean.
				let isProducerListView = !!this.listViewContainer?.querySelector("tr[class*=\"js-anime-category\"]");

				//GETTING THE "elements" VARIABLE, that will contain the HTML element of each individual anime entry on the view
				if(this.seasonalViewContainer || isProducerListView)
					//If it is a producerListView, we'll also get the ".seasonal-anime" elements
					elements = isProducerListView
								? this.listViewContainer.querySelectorAll(".seasonal-anime")
								: this.seasonalViewContainer.querySelectorAll(".seasonal-anime");

				else if(this.listViewContainer && !isProducerListView){
					//Each anime/manga <td> entry has a <div id=sarea{the id of the anime/manga}> inside it.
					//Therefore, to get all anime/manga entries, we select all <tr> elements that has divs that starts with "sarea".
					//with this we guarantee to take ONLY the anime entries, and not other irrelevant <tr> elements.
					elements = this.listViewContainer.querySelectorAll("tr:has(div[id^=sarea])");

					//List views organize the anime list in a table with multiple rows, each stat being a <td> column
					//These <td> columns have no identifiable classes or ids, therefore, in order to get the stat that we want, we'll need
					//to select all <td> childs of the anime/manga <tr> element, and use the indexScore and indexMembers positions to select
					//the correct elements.
					//This index-gathering proccess is done in the code below:

					//Gets the very first <tr> element of the list view, that is the row that contains the labels of the stats.
					let trTitle = this.listViewContainer.querySelectorAll("tr:not(:has(div[id^=sarea])")[0];
					//gets all <td> columns from the <tr> element that contains the labels of the stats, and iterates through it
					Array.from(trTitle.querySelectorAll("td"), (value, key)=>{
						//Looks for the <td> columns that has the label for "score" and "members"
						//If it finds the <td> elements, gather the index position of the <td> in the NodeList and store this index in
						//indexScore and indexMembers. By using those 2 values we'll know exactly what column to change in all elements.
						if (value.textContent?.toLowerCase().includes("score"))
							indexScore = key;
						else if(value.textContent?.toLowerCase().includes("members"))
							indexMembers = key;
					});
				}
				for(let element of elements){
					try{
						//the "skeleton" of each object that will be stored in this.animeViewElements
						let seasonalViewValues = {
							"score": {
								"value": undefined,
								"element": undefined
							},
							"members": {
								"value": undefined,
								"element": undefined
							}
						};

						//with this we get the ID of the anime/manga itself. This will be used as an identifier when storing the stats.
						let animeId = undefined;

						if(this.seasonalViewContainer){
							animeId = element.querySelector(".genres.js-genre")?.id;
							//the next two expressions get the TEXT NODE where the "score" and "members" stats are stored
							//we sadly cannot gather the DOM element itself, as these values have a <i> tag inside them, making it impossible
							//for us to replace the stats value with innerText or textContent without removing the <i> tag

							//by using a text node, we guarantee that we are altering ONLY the text value

							//REGEX: gets the text node that has numbers [0-9] OR the exact text "N/A"
							seasonalViewValues.score.element = Array.from(element.querySelector(".scormem-item.score").childNodes)
							.filter((node)=>/[0-9]|N\/A/g.test(node.textContent))[0];

							seasonalViewValues.members.element = Array.from(element.querySelector(".scormem-item.member").childNodes)
							.filter((node)=>/[0-9]|N\/A/g.test(node.textContent))[0];
						}else if(isProducerListView){
							/*
							 * EXPLAINING THE NON-SENSICAL RULES:
							 *
							 * animeId:
						 	 *		In the producer list view, each element has an "add" button that makes you add the current anime entry
							 *      to your list. This button has a ".ga-click.ga-impression" element inside it
						 	 *		And this element has an attribute "data-ga-click-param" that has a value of "aid:{the id of the anime}"
						 	 *
						 	 *		Therefore, to get the anime id we first get this element, extract the value from the attribute, and
					 		 *		lastly clear the "aid:" from the string by calling .replace() and there it is!
							 *
							 * score.element:
							 *		Each column of the <tr> element of the anime entry has multiple <td> ".borderClass" elements,
				 			 *    	And inside each one there's multiple ".spaceit_pad" divs, which includes the one responsible for
						     *		the "score" and "members" stats.
							 *
							 *		The SCORE element is the span of the ".spaceit_pad" that has a ".icon-people-score.star" inside it
							 * 		that is the little yellow star icon beside the score.
							 * 		As such the querySelector rule is ".spaceit_pad:has(.icon-people-score-star) span"
							 *
							 * members.element:
							 * 		We take the <td class="borderClass"> element that has the attribute "align" set to "right".
							 * 		This is because this is the <td> element that has the "score" and "members" stats.
							 *
							 * 		Then we get the LAST ".spaceit_pad" element of that <td>, as the "Members" score is the last element of the
							 * 		<td>. Making the querySelecotr rule ".borderClass[align=right] .spaceit_pad:last-child"
							 */
							animeId = element.querySelector(".ga-click.ga-impression").getAttribute("data-ga-click-param").replace("aid:", "");
							seasonalViewValues.score.element = element.querySelector(".spaceit_pad:has(.icon-people-score-star) span");
							seasonalViewValues.members.element = element.querySelector(".borderClass[align=right] .spaceit_pad:last-child");

						}else if(this.listViewContainer){
							//Like said before,
							//each anime/manga <td> entry in list views has a <div id=sarea{the id of the anime/manga}> inside it.
							//Therefore, to get the id, we select ID of the <div> from the current element that has an id that STARTS with "sarea"
							//and then we remove "sarea" from the string. That way, we successfully gather the id of the anime
							animeId = element.querySelector("div[id^=sarea]")?.id.replace("sarea", "");

							//gets the <td> elements associated	with "score" and "members"
							seasonalViewValues.score.element = element.querySelectorAll("td")[indexScore];
							seasonalViewValues.members.element = element.querySelectorAll("td")[indexMembers];
						}

						//console an error if couldn't gather the anime/manga id, and proceed with the loop
						if(!animeId){
							console.error("ERROR: Could not find the id of the anime element.\nIgnoring element");
							console.log(element);
							continue;
						}

						//getting the actual value of the scores
						seasonalViewValues.score.value =  seasonalViewValues.score.element?.textContent.replace("\n", "").trim();
						seasonalViewValues.members.value = seasonalViewValues.members.element?.textContent.replace("\n", "").trim();

						//storing the object into this.animeViewElements, using the anime id as an identifier
						this.animeViewElements[animeId] = seasonalViewValues;
					}catch(error){
						console.error(error);
						console.log(element);
					}
				}
			}

			console.log("seasonalViewContainer");
			console.log(this.seasonalViewContainer);

			console.log("listViewContainer");
			console.log(this.listViewContainer);

			console.log("animeViewElements");
			console.log(this.animeViewElements);

			console.log("animeViewElements size");
			console.log(Object.keys(this.animeViewElements).length);

		    console.log("scoreDetails");
			console.log(this.scoreDetails);

		    this.start();
		}catch(error){
			console.error(error);
		}finally{
			this.revertPreLoadHide();
		}
	}	
	

	/**
	 * Gets the value of this.settings from storage (calls {@link setSettingsFirstUse()} if there's no settings in storage) and then calls the
	 * appropriate methods to hide/show the stats upon getting in the screen, Like {@link setAnimeViewStatsVisibility()} and
	 * {@link setAnimePageStatsVisibility()}.
	 *
	 * Initializes the project's listeners by calling {@link startListeners()}
	 *
	 * And lastly, it reverts the changes of "preload-hide.css", making elements in the page visible again.
	 * This is done in the "finally" codeblock.
	 * @async
	 */
	async start(){				
		// await browser.storage.sync.clear(); //Wipes all storage, THIS IS MEANT FOR DEBUGGING *ONLY*.

		//retrieves all storage data and then throws an error, THIS IS MEANT FOR DEBUGGING *ONLY*
		// console.log("Testing storage"); console.log(await this.storageSync.getAllStorage()); throw new Error("Testing");
		try{
			this.settings = await this.storageSync.getFromStorage("scorehider_settings"); //retrieving settings

			//If there was an error while retrieving the settings, thrown an error
			if(this.settings?.error){
				console.error("There was an error while attempting to retrieve the settings");
				throw this.settings.error;
			}

			//If there was no error, but we still didn't get the settings, then it means it's the first time the extension
			//is being run.
			if(this.settings == undefined || this.settings == null){
				console.log("Couldn't find settings data.\nStoring settings for the first time.");
				let result = await this.setSettingsFirstUse(); //sets the settings for first time

				if(result.success)
					this.settings = result.dataStored.scorehider_settings; //if the data was stored, then just assign it to this.settings
				else
					throw result?.error;
			}
			console.log("settings");
			console.log(this.settings);

			//starts the hiding/showing proccess based on the settings
			if(this.seasonalViewContainer || this.listViewContainer)
				this.setAnimeViewStatsVisibility(this.settings);
			else if(this.statsBlock || this.leftSidebar || this.reviewTab)
				this.setAnimePageStatsVisibility(this.settings);

			this.startListeners(); //Initialize the listeners
		}catch(error){
			console.error(error);
		}finally{
			this.revertPreLoadHide();
		}
	}

	/**
	 * The container elements of the score stats are hidden upon loading by the "preload-hide.css" file
	 * This function makes sure that the elements that were hidden in that file will be revealed again
	 *
	 * it is of utmost importance of this function to work appropriately, otherwise it could break the pages that this extension is executed in
	 */
	revertPreLoadHide(){
		console.log("reverting pre-load hide");
		//making the elements hidden the preload-hide.css visible again
		if(this.divStatsBlock)
			this.divStatsBlock.style.opacity = "1";

		if(this.leftSidebar)
			this.leftSidebar.style.opacity = "1";

		if(this.infoReviewHeader)
			this.infoReviewHeader.style.opacity = "1";

		if(this.seasonalViewContainer)
			this.seasonalViewContainer.style.opacity = "1";

		if (this.listViewContainer)
			this.listViewContainer.style.opacity = "1";
	}
	/**
	 *  Makes an array of every single stat, and stores this array in the "scorehider_settings" position of storage
	 *  by calling {@link StorageSync#setInStorage()}.
	 *
	 *	@async
	 *  @returns {Promise<
	 * 		{"success": true, "error": undefined, "dataStored": [...]} |
	 *  	{"success": false, "error": Error}
	 *  >} - Returns the value of {@link StorageSync#setInStorage()}, but attaches "dataStored" to the Object if the storage was successful
	 */
	async setSettingsFirstUse(){

		//creating list that we're going to store
		let dataToStore = {
			"scorehider_settings": Object.keys(this.scoreDetails)//by default we hide every single stat
		};

		let result = await this.storageSync.setInStorage(dataToStore); //storing settings
		if(result.success)
			result.dataStored = dataToStore;

		return result;
	}




	/**
	 * hides/shows the elements in the ANIME/MANGA page.
	 * Since the anime/manga page contains multiple "blocks" with different stats, this method calls multiple appropriate methods to hide
	 * each stat on the different sections of the page. The current method calls are:
	 * {@link updateStatsBlockScore()}: hides/shows the stats on the stats block (the "main" stat section that highlights the score of the anime)
	 * {@link updateLeftSideScore()}: hides/shows the stats on the left side bar "statistics" tab
	 * {@link updateReviewScore()}: hides/shows the stats in the "reviews" section. *IMPORTANT*, it won't hide the reveals, only the STATS in that
	 * section, like the amount of recommended reviews, the ratio bar, etc. For more information check the comments on updateReviewScore()
	 *
	 * @param {Array} hideList - Array containing the name of the elements that are going to be HIDDEN.
	 * @param {Array} showList - Array containing the name of the elements that are going to be SHOWN.
	 */
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
							this.updateReviewScore(statName, newValue);

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

	/**
	 * hides/shows the stats in the seasonal anime page.
	 * this method is also valid for manga magazine lists, genre lists, and demographic lists. In general, if "this.seasonalViewContainer" is set
	 * then this method will run.
	 *
	 * This method iterates through EACH VALUE of "this.animeViewElements" attribute to hide/show the stats **EACH TIME** it's called.
	 *
	 * @param {Array} hideList - Array containing the name of the elements that are going to be HIDDEN.
	 * @param {Array} showList - Array containing the name of the elements that are going to be SHOWN.
	 * IMPORTANT! these pages only show the "score" and "members" stats, so this method only hide these values.
	 */
 	setAnimeViewStatsVisibility(hideList = [], showList = []){

		//making an array of all anime ids that were stored in this.animeViewElements
		let seasonalIds = Object.keys(this.animeViewElements);

		//defining the "function" that we're going to run in order to hide/show the stats
		let scoreVisibility = (ids, statList, action) =>{
				console.log(`setAnimeViewStatsVisibility(): STARTING TO ${action.toUpperCase()} THE ELEMENTS`);
				//TODO: This is a pretty heavy iteration. For example: If there's 300 anime entries in the fall 2010 page, then this will run
				//300 times. Each time we try to hide or show the elements, it'll run 300 times.
				//I tried my best to make it concise, but I don't know if there could be possible performance issues.
				//since it works just fine for me, I'll just proceed with the development normally, but this section must be closely monitored.
				for(let id of ids){
					//in the anime view screen, the only stats are "score" and "members"
					try{
						let valueScore, valueMembers;
						//Setting the value of "valueScore" and "valueMembers" depending on the "action" we are operating
						switch(action){
							case "hide":
								valueScore = this.scorePlaceholder;
								//specifically for the Producers's List view, the "members" stat is set as "{Amount of Members} Members"
								//So for this case, when hiding this element, instad of just replacing it with "this.scorePlaceholder", we need to
								//replace it with "this.scorePlaceholder" plus the "Members" string.
								valueMembers = this.animeViewElements[id].members.value?.includes("Members")
												? `${this.scorePlaceholder} Members`
												: this.scorePlaceholder;
								break;
							case "show":
								valueScore = this.animeViewElements[id].score.value;
								valueMembers = this.animeViewElements[id].members.value;
								break;
						}

						//setting the stat element with the value if it is present in the statList
						if(statList.includes("score") && this.animeViewElements[id].score.element)
							this.animeViewElements[id].score.element.textContent = valueScore;

						if(statList.includes("members") && this.animeViewElements[id].members.element)
							this.animeViewElements[id].members.element.textContent = valueMembers;

					}catch(error){
						console.error(`setAnimeViewStatsVisibility(): There was an error while trying to ${action.toUpperCase()} a stat of the anime/manga id ${id}`);
						console.error(error);
						continue;
					}

				}
				console.log(`setAnimeViewStatsVisibility(): FINISHED "${action.toUpperCase()}"`);
		}

		//this is a bit ugly, but honestly, who cares?
		//way better than having 3 nested "for" loops
		if(hideList.length > 0)
			scoreVisibility(seasonalIds, hideList, "hide");
		if(showList.length > 0)
			scoreVisibility(seasonalIds, showList, "show");

	}
	/**
	* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	* THIS METHOD IS ABOUT THE "Stat Block" section in the anime/manga page.
	* The stat block is the element of the Anime/Manga page that highlights the score of the anime/manga at the top of the page.
	* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	*
	* Changes the value of the stat informed in statName with the in the STATS BLOCK section of the Anime/Manga page.
	* @param {string} statName - the name of the stat that will have it's value changed
	* @param {string} newValue - the value that we'll put in the "statName" position of the stat block
	*/
	updateStatsBlockScore(statName, newValue){
		let statElement = this.scoreDetails[statName].element.statsBlock;
		newValue = newValue.replace("\n", "").trim(); //removing spaces and "\n" from the newValue so the statsBlock won't change
		if(statName == "users")
			statElement.setAttribute("data-user", `${newValue} users`);
		else
			statElement.replaceChildren(newValue);
	}

	/**
	 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	 * THIS METHOD IS ABOUT THE "left side" section in the anime/manga page.
	 * The "left side" is the section of the anime/manga page on the left that says "statistics" and contains the stats of the
	 * current anime/manga
	 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	 *
	 * Changes the value of the stat informed in statName with the in the LEFT SIDE section of the Anime/Manga page.
	 * @param {string} statName - the name of the stat that will have it's value changed
	 * @param {string} newValue - the value that we'll put in the "statName" position of the left side
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

	/**
	 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	 * THIS METHOD IS ABOUT THE "review stats" section in the anime/manga page.
	 * The "review stats" is the section of the anime/manga page that has information concerning the user reviews of the anime/manga
	 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	 *
	 * Changes the value of the stat informed in statName with the in the REVIEW section of the Anime/Manga page.
	 * IMPORTANT! It DOES NOT remove the reviews themselves. It just hides/shows the review STATS, such as:
	 * - Amount of recommended reviews
	 * - Amount of mixed reviews
	 * - Amount of not recommended reviews
	 * - Review ratio bar
	 * - Amount of reviews
	 * @param {string} statName - the name of the stat that will have it's value changed
	 * @param {string} newValue - the value that we'll put in the "statName" position of the left side
	 */
	updateReviewScore(statName, newValue){
		let statElement = this.scoreDetails[statName].element.reviewTab;
		if(statName == "ratio_bar")
			statElement.style.visibility = newValue;
		else
			statElement.textContent = newValue;
	}

	/**
	 * Returns the element or text node IN THE LEFT SIDE BAR that has the stat that was informed in "elementName"
	 * The reason why it's done separately, and so extensively, is because the Myanimelist devs built the "statistics" tab in a way that it's
	 * impossible to access the values directly with a class or id selection, as almost NO elements in that section has any unique identifiable
	 * class or id. Forcing us to do take a bunch of random steps to get the values we want.
	 *
	 * this is "gambiarra" in its purest form. The man may leave gambiarra, but gambiarra never leaves the man
	 *
	 * @param {string} elementName - the name of the element to get from the left side
	 * @returns {<Object>} - Either a DOM element, or (and for most elements) a text node
	 */
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
				
				/*
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

	/**
	 * Defines the event listeners of the class that will make the MAL page react to user input in the popup and other situations.
	 */
	startListeners(){

		//STORAGE UPDATE LISTENER
		//this listener will be triggered as soon as a value in the popup is checked/unchecked
		//TODO: When I implement the "default placeholder" change, it might be more interesting to make this a private function, that
		//calls for "onSettingsChange" or the, say, "placeholderChange", depending on the value changed, and then updates the settings.
		//keep this in mind when you finally implement this system
		browser.storage.sync.onChanged.addListener((changes) => this.onSettingsChange(changes));
	}

	/**
	 * This methods is called in {@link startListeners()} storage listener whenever a value gets changed in storage.
	 * It is responsible for recalling the hide/show methods when scorehider_settings has new parameters (This action made in the extension's
	 * popup)
	 *
	 * @param {Object} changes - the parameter from storage.sync.onChanged, that is the value that was changed and its changes
	 * it must follow this pattern:
	 * {"scorehider_settings": {"oldValue": [...], "newValue": [...]}}
	 *
	 *
	 */
	onSettingsChange(changes){
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

			if(this.seasonalViewContainer || this.listViewContainer){
				//this makes sure the arguments are either "score" or "members", or both
				hideList = hideList.filter((value)=>value=="score"||value=="members");
				showList = showList.filter((value)=>value=="score"||value=="members");
				this.setAnimeViewStatsVisibility(hideList, showList);
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
	}
}

//instantiating the ScoreHider class, making it execute the commands.
let score = new ScoreHider();
