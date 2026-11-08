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
		this.infoReviewHeader = document.querySelector("div[class*=review__header]");
		this.scorePlaceholder = "?"; //The text that will replace the scores	
		this.settings = [];
		//Receives the anime hover popup stats. Check the "popupObserver" variable from startObservers() for more details
		this.scorePopupElements = {};
		try{
			this.storageSync = new StorageSync(); //from js/storageSync.class.js

			//matches for "/manga/{manga id}" and "/anime/{anime id}"
			if(/anime\/[0-9]|manga\/[0-9]/g.test(location.pathname)){
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
			}
			this.animeViewElements = {}; //will store the stats and other information of ALL anime entries in the seasonal/list anime page.

			//getting information on various anime lists in MAL
			let views = [
				//seasonal tab, it also refers to other pages like manga/magazine/282/Shounen_Champion_Monthly for example
				//some LIST VIEWS also have the class ".js-categories-seasonal" with ".seasonal-anime" elements inside it, so to get the true SEASONAL
				//view we need to filter by the ones that has ".seasonal-anime" but are NOT ".list".

				//Also, in the ANIME STACK page, the seasonal view element has the EXACT class "seasonal-anime-list". But on MAGAZINE lists it
				//is a "js-categories-seasonal" with multiple "seasonal-anime-list" inside it.
				//Therefore, in anime stack pages with need to take the element that ONLY has the seasonal-anime-list element.
				//And in the other screens, we need to take the js-categories-seasonal that DOES NOT have divs with the exact "seasonal-anime-list"
				//In them (.seasonal-anime-list.{some other class} is fine though)
				{"type": "seasonal", "element": document.querySelector(".js-categories-seasonal:has(.seasonal-anime):not(.list, .tile-anime-list, :has([class=seasonal-anime-list])), [class=seasonal-anime-list]")},


				//refers to the LIST VIEW of the anime/manga pages. For example: https://myanimelist.net/anime.php?cat=anime&q=anime
				//The LIST VIEW of the Producers's page has ".js-categories-seasonal.list" class instead of ".js-block-list.list".
				//So I added both rules to the querySelector, in a way that it will get either one.
				{"type": "list", "element": document.querySelector(".js-block-list.list:not(.tile-anime-list), .js-categories-seasonal.list:not(.tile-anime-list)")},

				//This refers to the TILE VIEW, that shows up in producer pages and anime stacks.
				{"type": "tile", "element": document.querySelector(".tile-anime-list")},

				//This refers specifically to the "/people/" page, like Oda Eiichiro's page
				//doesn't have an "element" attribute since it hides the scores in a different way (check the other "people" related comments)
				{"type": "people"}
			];

			this.animeView = views.filter((view)=>{
				//returns the element that is not undefined OR, if in the "/people/" page, returns the "people" view
				return view.element || (view.type == "people" && location.pathname.startsWith("/people/"))
			})[0];
			console.log("this.animeView");
			console.log(this.animeView);
			if(this.animeView){
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
				let isProducerListView;
				//GETTING THE "elements" VARIABLE, that will contain the HTML element of each individual anime entry on the view
				switch(this.animeView.type){
					case "people":
						//getting both the "anime staff" and "published manga" entries.
						elements = document.querySelectorAll(".js-table-people-staff  .js-people-staff, .js-table-people-manga .js-people-manga");
						break;
					case "seasonal":
					case "tile":
						elements = this.animeView.element.querySelectorAll(".seasonal-anime");
						break;
					case "list":
						isProducerListView = !!this.animeView.element.querySelector("tr[class*=\"js-anime-category\"]");

						if(isProducerListView)
						    elements = this.animeView.element.querySelectorAll(".seasonal-anime");
						else{
							//Each anime/manga <td> entry has a <div id=sarea{the id of the anime/manga}> inside it.
							//Therefore, to get all anime/manga entries, we select all <tr> elements that has divs that starts with "sarea".
							//with this we guarantee to take ONLY the anime entries, and not other irrelevant <tr> elements.
							elements = this.animeView.element.querySelectorAll("tr:has(div[id^=sarea])");

							//List views organize the anime list in a table with multiple rows, each stat being a <td> column
							//These <td> columns have no identifiable classes or ids, therefore, in order to get the stat that we want, we'll need
							//to select all <td> childs of the anime/manga <tr> element, and use the indexScore and indexMembers positions to select
							//the correct elements.
							//This index-gathering proccess is done in the code below:

							//Gets the very first <tr> element of the list view, that is the row that contains the labels of the stats.
							let trTitle = this.animeView.element.querySelectorAll("tr:not(:has(div[id^=sarea])")[0];
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
						break;
				}

				//Bulding the this.animeViewElements
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
						let animeId;

						switch(this.animeView.type){
							case "seasonal":
								animeId = element.querySelector(".genres.js-genre")?.id;
								//Specifically in the "stacks" screen, the ".genres.js-genre" element doesn't have an id, for WHATEVER reason
								//but it's still possible to get the id in the ".ga-click.ga-impression" element.
								if(!animeId)
									animeId = element.querySelector(".ga-click.ga-impression").getAttribute("data-ga-click-param").replace("aid:", "");
								//the next two expressions get the TEXT NODE where the "score" and "members" stats are stored
								//we sadly cannot gather the DOM element itself, as these values have a <i> tag inside them, making it impossible
								//for us to replace the stats value with innerText or textContent without removing the <i> tag

								//by using a text node, we guarantee that we are altering ONLY the text value

								//REGEX: gets the text node that has numbers [0-9] OR the exact text "N/A"
								seasonalViewValues.score.element = Array.from(element.querySelector(".scormem-item.score").childNodes)
								.filter((node)=>/[0-9]|N\/A/g.test(node.textContent))[0];

								seasonalViewValues.members.element = Array.from(element.querySelector(".scormem-item.member").childNodes)
								.filter((node)=>/[0-9]|N\/A/g.test(node.textContent))[0];
								break;

							case "tile":
								animeId = element.querySelector(".ga-click").getAttribute("data-ga-click-param").replace("aid:", "");
								//getting the TEXT NODE of the "score" and "members" elements
								//We need to get the text node because there's icons inside the elements. If we change the html of the element
								//it will replace the icons. So it's better to alter the text node directly

								//we get the text node by making an array of the element's childNodes, and then filtering the value to get only
								//the nodes whose textContent has numbers OR exactly "N/A"
								seasonalViewValues.score.element = Array.from(element.querySelector(".stars").childNodes)
								.filter((node)=>/[0-9]|N\/A/g.test(node.textContent))[0];

								//P.S, despite the element class being called "users", it refers to the "members" stat. So don't get confused.
								seasonalViewValues.members.element = Array.from(element.querySelector(".users").childNodes)
								.filter((node)=>/[0-9]|N\/A/g.test(node.textContent))[0];
								break;
							case "people":
							case "list":
								if(isProducerListView || this.animeView.type == "people"){
									//[05/11/2026] - Including "/people/" page in this code, as it also uses the same system as the producer list view
									/*
									 * EXPLAINING THE NONSENSE:
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
									 * 		Then we get the LAST ".spaceit_pad" element of that <td>, as the "Members" score is the last element of
									 * 	the <td>. Making the querySelecotr rule ".borderClass[align=right] .spaceit_pad:last-child"
									 */
									animeId = element.querySelector(".ga-click.ga-impression").getAttribute("data-ga-click-param").replace("aid:", "");
									seasonalViewValues.score.element = element.querySelector(".spaceit_pad:has(.icon-people-score-star) span");
									seasonalViewValues.members.element = element.querySelector(".borderClass[align=right] .spaceit_pad:last-child");
								}else{
									//each anime/manga <td> entry in list views has a <div id=sarea{the id of the anime/manga}> inside it.
									//Therefore, to get the id, we select ID of the <div> from the current element that has an id that STARTS with "sarea"
									//and then we remove "sarea" from the string. That way, we successfully gather the id of the anime
									animeId = element.querySelector("div[id^=sarea]")?.id.replace("sarea", "");

									//gets the <td> elements associated	with "score" and "members"
									seasonalViewValues.score.element = element.querySelectorAll("td")[indexScore];
									seasonalViewValues.members.element = element.querySelectorAll("td")[indexMembers];
								}
								break;
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

			console.log("animeViewElements");
			console.log(this.animeViewElements);

			console.log("animeViewElements size");
			console.log(Object.keys(this.animeViewElements).length);

		    console.log("scoreDetails");
			console.log(this.scoreDetails);

		    this.start();
		}catch(error){
			console.error(error);
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
			if(Object.keys(this.animeViewElements).length > 0)
				this.setAnimeViewStatsVisibility(this.settings);
			else if(this.scoreDetails && (this.divStatsBlock || this.leftSidebar || this.reviewTab))
				this.setAnimePageStatsVisibility(this.settings);

			this.startListeners();
		    this.startObservers();
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

		if(this.animeView?.element)
			this.animeView.element.style.opacity = "1";
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
	 * this method is also valid for manga magazine lists, genre lists, and demographic lists. In general, if "this.animeView.type" is "seasonal"
	 * then this method will run.
	 *
	 * This method iterates through EACH VALUE of "this.animeViewElements" attribute to hide/show the stats **EACH TIME** it's called.
	 *
	 * IMPORTANT! It will ignora any value from hideList/showList that isn't "score" or "members".
	 *
	 * @param {Array} hideList - Array containing the name of the elements that are going to be HIDDEN.
	 * @param {Array} showList - Array containing the name of the elements that are going to be SHOWN.
	 */
 	setAnimeViewStatsVisibility(hideList = [], showList = []){
		//making an array of all anime ids that were stored in this.animeViewElements
		let seasonalIds = Object.keys(this.animeViewElements);

		//defining the "function" that we're going to run in order to hide/show the stats
		let scoreVisibility = (ids, statList, action) =>{
				//making sure we won't include anything other than "score" and "members" in the statList
				statList = statList.filter((stat)=>["score", "members"].includes(stat));
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
	 * hides/shows the stats in the hovering popups of various MAL pages.
	 * It iterates through the elements in "this.scorePopupElements"
	 *
	 * IMPORTANT! It will ignore all values from hideList/showList that aren't one of the following:
	 * 	score, users, rank, popularity, members.
	 *
	 * @param {Array} hideList - Array containing the name of the elements that are going to be HIDDEN.
	 * @param {Array} showList - Array containing the name of the elements that are going to be SHOWN.
	 */
	setAnimePopupStatsVisiblity(hideList = [], showList = []){
		//defining the "function" that we're going to run in order to hide/show the stats
		let scoreVisibility = (statList, action) =>{
			console.log(`setAnimePopupStatsVisiblity(): STARTING TO ${action.toUpperCase()} THE ELEMENTS`);
			//making sure we'll ignore stats that aren't in the popup.
			statList = statList.filter((stat)=>["score", "users", "rank", "popularity", "members"].includes(stat));

			//iterating through each entry of this.scorePopupElements
			for(let [id, popupStats] of Object.entries(this.scorePopupElements)){
				//iterating through each stat we want to show/hide
				for (let stat of statList){
					try{
						switch(action){
							case "hide":
								if(stat == "users")
									popupStats[stat].element.textContent = `(scored by ${this.scorePlaceholder} users)`;
								else
									popupStats[stat].element.textContent = `\n${this.scorePlaceholder}\n`;
								break;
							case "show":
								popupStats[stat].element.textContent = popupStats[stat].value;
								break;
						}
					}catch(error){
						console.error(`setAnimePopupStatsVisiblity(): There was an error while trying to ${action.toUpperCase()} the "${stat}" of the anime/manga ${id}`);
						console.error(error);
						continue;
					}

				}
			}
			console.log(`setAnimePopupStatsVisiblity(): FINISHED "${action.toUpperCase()}"`);
		}

		//this is a bit ugly, but honestly, who cares?
		//way better than having 3 nested "for" loops
		if(hideList.length > 0)
			scoreVisibility(hideList, "hide");
		if(showList.length > 0)
			scoreVisibility(showList, "show");
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
	 *
	 * Starts various Mutation Observers of the project
	 */
	startObservers(){
		//SEARCHBAR OBSERVER==================================================================================================================
		//If "score" is in this.settings, this observer hides the "SCORE" stat from the searchbar
		let searchbarObserver = new MutationObserver((changes)=>{
			//seeing if the settings contains "score"
			if(this.settings.includes("score")){
				//"changes" is always an array of mutations, so we need to iterate through it each time
				for(let change of changes){
					//when the user hovers over a search result, the anime element adds an ".extra-info" div, and then adds multiple text
					//contents to that div sequentially, one of them being the "score" information

					//So this code simply checks if the mutation target is ".extra-info" AND if the text "Score: " was added, if true then
					//we alter the text node to hide the score.
					if(change.target?.classList.contains("extra-info") && change.addedNodes[0]?.textContent.toLowerCase().includes("score")){
						change.addedNodes[0].textContent = `Score: ${this.scorePlaceholder}`; //replacing text to hide the score
						console.log("OBSERVER: score element found.");
						console.log(change);
					}
				}
			}

		});

		//calling observer() on the searchbar observer
		//"menu_right" is an element that contains some elements from the top-right side of the page, which also includes the search bar
		//it isn't possible to use the searchbar *itself*
		if(document.getElementById("menu_right"))
			searchbarObserver.observe(document.getElementById("menu_right"), {"childList": true,"subtree":true});

		//POPUP OBSERVER=======================================================================================================================
		//When you hover over an anime picture, in some pages, a popup option shows up showing a small part of the synopisis and multiple stats
		//like "score", "members", "users", etc.

		//But this isn't a case of the popups being invisible in the document, the information is dumped into the popup ONLY AFTER the user hovers
		//the anime/manga picture, in which case a new "hoverinfo-contaniner" element is created.
		//Thefore IT IS NOT POSSIBLE to gather every single popup information upon loading the page, as they'll only exist the momment the user
		//hovers through the anime picture.

		//As such, this solution instead detects whenever a new "hoverinfo-contaniner" is created, and then store the relevant stat information
		//in this.scorePopupElements.
		//!IMPORTANT!, when the popup is created, this observer also automatically hides the stat, as long as the individual stat is set to be
		//hidden in this.settings.
		let popupObserver = new MutationObserver((changes)=>{

			//Whenever a user hovers the popup for the first time, it triggers 3 Mutations
			//One does something that I do not care, the other puts the text "Loading..." in the popup, and the last one removes the "Loading..."
			//text from the popup and dumps all of the score information at once in the popup.
			//They all have the element "hoverinfo-contanier" (no, it's not a typo, it's genuinely how it is in the HTML) as a target.

			//Since the one that dumps the information also removes the "Loading..." node, we can filter the Mutation we want by selecting only
			//the one that REMOVES NODES.
			let mutation = changes.find((change)=>{
				return change.target.classList.contains("hoverinfo-contaniner") && change.removedNodes.length > 0;
			});


			if(mutation){
				//the "hoverinfo-container"'s parent element (the class of the parent depends on the page you're at) contains a "rel" attribute
				//this attribute follows this format: "m{manga id}" or "a{anime id}".
				//So, to extract the anime's id, we remove anything that's not a number from the attribute's value
				let animeId = mutation.target.parentElement.getAttribute("rel").replace(/[^0-9]/g, "");

				//the "skeleton" of the value that we'll store in the entries of this.scorePopupElements
				let animeRatings = {
					"score": {"element": undefined, "value": undefined},
					"users": {"element": undefined, "value": undefined},
					"rank": {"element": undefined, "value": undefined},
					"popularity": {"element": undefined, "value": undefined},
					"members": {"element": undefined, "value": undefined}
				}

				let animeRatingsKeys = Object.keys(animeRatings);

				//bulding an array of each <span> and <small> added node
				let nodes = Array.from(mutation.addedNodes).filter((node)=>node.nodeName == "SPAN" || node.nodeName == "SMALL");
				for(let node of nodes){
					//The only <small> added node refers to the "users" stat
					if(node.nodeName == "SMALL"){

						//storing the element and value
						animeRatings.users.element = node;
						animeRatings.users.value = node.textContent;

						//If the current stat is set to be hidden in the settings, then we hide the value right away
						if(this.settings.includes("users"))
							animeRatings.users.element.textContent = `(scored by ${this.scorePlaceholder} users)`;
					}else{
						//All added <span> nodes are "labels". Like "Score:", "Rank:", "Members:", etc.
						//The value corresponding to each <span> node "label" is the <span> next sibling, that is a text node
						//therefore, to store the stat's  value, we first need to check if the <span> "label" refers to a valid stat in the
						//animeRatings list.

						let statLabel = node.textContent?.toLowerCase().replace(":", ""); //extracting the name of the "label"
						//getting the animeRatings key that corresponds to the "label".
						//If it isn't in the animeRatings keys (Like "type" or "genres" for example) then it doesn't return anything
						let rating = animeRatingsKeys.find((rating) => statLabel.includes(rating));

						//this will only execute if a valid rating was found
						if(rating){
							//storing the element and value
							animeRatings[rating].element = node.nextSibling;
							animeRatings[rating].value = node.nextSibling?.textContent;

							//If the current stat is set to be hidden in the settings, then we hide the value right away
							if(this.settings.includes(rating))
								animeRatings[rating].element.textContent = `\n${this.scorePlaceholder}\n`;
						}
					}
				}
				//storing the animeRatings value in the this.scorePopupElements
				this.scorePopupElements[animeId] = animeRatings;
				console.log("this.scorePopupElements", this.scorePopupElements);
			}
		});
		//STARTING THE POPUP OBSERVER
		//#content is a div that is present in every page. It is basically the main div of myanimelist, which contains all content of the page.
		//if the element has "raInfo" or "sarea" elements, which are related to the popups, then the observer will be run using #content as basis

		//The reason why I made the observer watch #content and not something more specific is because I realized that the "main containers"
		//of the elements with the anime entries that has popup change depending on the page the user is in. And since I don't want to map every
		//single page I just decided to just use the #content div instead, as it is in every page afterall.

		//still, some of the popup elements have different classes depending on the page, which's why I'm running "raInfo" and "sarea" filters
		//(rainfo is from the RECOMMENDATIONS page, sarea is from the LIST view pages)
		if(document.querySelector("#content:has([id^=raInfo]), #content:has([id^=sarea])"))
			popupObserver.observe(document.querySelector("#content:has([id^=raInfo]), #content:has([id^=sarea])"),{"childList": true,"subtree":true});


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

			//calling the appropriate functions
			if(Object.keys(this.animeViewElements).length > 0)
				this.setAnimeViewStatsVisibility(hideList, showList);
			else if(this.scoreDetails && (this.divStatsBlock || this.leftSidebar || this.reviewTab))
				this.setAnimePageStatsVisibility(hideList, showList); //ANIME PAGE

			if(Object.keys(this.scorePopupElements).length > 0)
				this.setAnimePopupStatsVisiblity(hideList, showList);


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
