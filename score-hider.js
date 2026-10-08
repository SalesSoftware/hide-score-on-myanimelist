/**
 *TODO 1)
 * 	Hide the scores from the left side bar, and amount of Recommended/Mixed/Not Recommended reviews as
 *  well
 * 
 * TODO 2)
 * 	Create a extension popup, where the user can choose to hide/show the scores again
 *  Also make it so the user can choose WHICH scores to hide (stat-block, side-bar, reviews)
 * 
 * TODO 3)
 * 	Create an Icon for the project
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
		this.reviewDetails = {
			"recommend": this.infoReviewHeader?.querySelector(".recommended strong"),
			"mixed": this.infoReviewHeader?.querySelector(".mixed-feelings strong"),
			"notRecommend": this.infoReviewHeader?.querySelector(".not-recommended strong"),
			"ratioBar": this.infoReviewHeader?.querySelector(".review-ratio__bar"),
			"amount": this.infoReviewHeader?.querySelector(".right strong")
		}
		
		this.scorePlaceholder = "?"; //The text that will replace the scores

		/*
			array of objects containing relevent information about the DOM elements
			related to the scores

			it follows this format:

			type => the name/type of the score
			element => the DOM element related to the score
			value => the ORIGINAL VALUE of the score before being hidden
		
		*/
		this.scoreDetails = [
			{
				"type": "score",
				"element": {
					"statsBlock": this.divStatsBlock?.querySelector(".score-label"),
					"leftSide": this.leftSidebar.querySelector(".score-label")
				},
				"value": this.divStatsBlock.querySelector(".score-label").innerText
			},
			{
				"type": "users",				
				"element": {
					//DISCLAIMER: The value is in .fl-l.score "data-user" attribute
					"statsBlock": this.divStatsBlock?.querySelector(".fl-l.score"),					
					"leftSide": this.getSidebarTextNode("users")
				},				
				"value": this.divStatsBlock.querySelector(".fl-l.score").getAttribute("data-user")							
			},
			{
				"type": "rank",
				"element": {
					"statsBlock": this.divStatsBlock?.querySelector(".numbers.ranked strong"),
					"leftSide": this.getSidebarTextNode("ranked")

				},				
				"value": this.divStatsBlock.querySelector(".numbers.ranked strong").innerText
			},
			{
				"type": "popularity",
				"element": {
					"statsBlock": this.divStatsBlock?.querySelector(".numbers.popularity strong"),
					"leftSide": this.getSidebarTextNode("popularity")
				},				
				"value": this.divStatsBlock.querySelector(".numbers.popularity strong").innerText
			},
			{
				"type": "members",
				"element": {
					"statsBlock": this.divStatsBlock?.querySelector(".numbers.members strong"),
					"leftSide": this.getSidebarTextNode("members")
				},			
				"value": this.divStatsBlock.querySelector(".numbers.members strong").innerText
			},
			{
				"type": "favorites",
				"element": {					
					//the "favorites" section only show up in the left side bar
					"leftSide": this.getSidebarTextNode("favorites")
				},			
				//using "?." in case getSidebarTextNode() returns null 
				"value": this.getSidebarTextNode("favorites")?.textContent
			},
	    ];	  
	    console.log("scoreDetails");
	    console.log(this.scoreDetails);
	    //calling the function that hides the scores
	    
	    //this.statsBlockHideScores();
	    //this.sideBarHideScores();
	    //this.hideReviewStats();

	    //this.hideSidebarStat(["favorites", "score", "popularity"]);
		this.hideSidebarStats(["all"]);
		this.hideStatsBlockStats(["all"]);
	    //stats-block visible again!
	    this.divStatsBlock.style.opacity = "1";

	}	

	/*
		Receives an array with stat names, and hides every stat informed in the array
		if statList is "all" or ["all"] it will hide every single stat from the left side bar

		statList examples:
		["members", "score", "popularity"]
		["users"]
		["all"]
		"all"
	*/
	hideStatsBlockStats(statList){
		//if statList is "all", all elements from the left side bar will be hidden
		if(statList === "all" || statList[0] == "all")		
			//making sure "favorites" isn't in the list, since it's not in the stats block	
			statList = this.scoreDetails.reduce((results, value)=>{				
				if(value.type != "favorites")
					results.push(value.type)
				return results;
			}, []);

		//iterating through each type of score and hiding all values
		for(let statName of statList){						
			console.log(`hideStatBlockStat(): HIDING "${statName}" stat`);
			try{
				//getting the actual DOMElement/text node of the stat we want to hide
				let statElement = this.scoreDetails.filter((e)=>{
					return e.type == statName;
				});				
				statElement = statElement[0].element.statsBlock;					
				//since the "users" score is an attribute, we need to hide the value differently.				
				if(statName == "users")
					statElement.setAttribute("data-user", `${this.scorePlaceholder} users`);			
				else					
					statElement.replaceChildren(this.scorePlaceholder);			
			}catch(error){
				console.error(`hideStatBlockStat(): ERROR while hiding "${statName}" (${error})`);
			}
		}
	}

	/*
		Receives an array with stat names, and hides every stat informed in the array
		if statList is "all" or ["all"] it will hide every single stat from the left side bar

		statList examples:
		["favorites", "score", "popularity"]
		["users"]
		["all"]
		"all"
	*/
	hideSidebarStats(statList){
		//if statList is "all", all elements from the left side bar will be hidden
		if(statList === "all" || statList[0] == "all")
			statList = this.scoreDetails.map((e)=>{
				return e.type;
			});

		//iterating through the entire statList and hiding all the elements 
		for(let statName of statList){		
			console.log(`hideSidebarStat(): HIDING "${statName}" stat`);
			//getting the actual DOMElement/text node of the stat we want to hide
			let statElement = this.scoreDetails.filter((e)=>{
				return e.type == statName;
			});
			statElement = statElement[0].element.leftSide;	

			try{
				//replacing the textContent of the stat element, effectively hiding the stat.
				switch(statName){
					case "users":
						//The first if is for when the text node is COMPLETE
						//e.g: #text: "(scored by 200 users)"

						//the else is for when the text node is separated
						//e.g: #text: "(scored by " | #text: "200 users)" <-- the one we're altering						
						if(statElement.textContent.includes("(scored by"))
							statElement.textContent = `\n(scored by ${this.scorePlaceholder} users)\n`;
						else
							statElement.textContent = `\n ${this.scorePlaceholder} users)\n`;
						break;
					case "score":						
						statElement.textContent = this.scorePlaceholder;
						break;
					case "rank":
						statElement.textContent = `\n ${this.scorePlaceholder}`;
						break;	
					default: 
						statElement.textContent = `\n ${this.scorePlaceholder}\n`;	
				}
			}catch(error){
				console.error(`hideSidebarStat(): ERROR while hiding "${statName}" (${error})`);
			}				
		}
	}

	//get the text node from the stat from the left side bar
	getSidebarTextNode(elementName) {
		elementName = elementName.toLowerCase(); //putting the parameter in lowercase				

		//getting a list of all .spaceit_pad from the left side bar
		let leftElements = Array.from(this.leftSidebar.querySelectorAll(".spaceit_pad"));		
		
		/*
		getting the DIV that has the value informed in the parameter		
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
				console.error(`ERROR: getSidebarTextNode() error when trying to retrieve "${elementName}" (${error})`);
			}
		}
		//if the element is undefined, return null
		//most likely an invalid elementName was informed 
		return null;
		
	}
	
	//hides elements from the REVIEW section of the page
	hideReviewStats(){
		this.reviewDetails["ratioBar"].style.visibility = "hidden";
		this.reviewDetails["recommend"].textContent = this.scorePlaceholder;
		this.reviewDetails["mixed"].textContent = this.scorePlaceholder;
		this.reviewDetails["notRecommend"].textContent = this.scorePlaceholder;
		this.reviewDetails["amount"].textContent = this.scorePlaceholder;
	}
}

//instanciating the ScoreHider class, making it execute the commands.
let score = new ScoreHider();


