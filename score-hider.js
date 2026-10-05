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
		//IMPORTANT: .stats-block is automatically hidden by css/preoload-hide.css
		//As such it's CRITICALLY IMPORTANT that this file makes it visible again after hiding the scores
		this.divStatsBlock = document.querySelector(".stats-block");
		this.leftSidebar = document.querySelector(".leftside");

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
					"statsBlock": this.divStatsBlock.querySelector(".score-label"),
					"leftSide": this.leftSidebar.querySelector(".score-label")
				},
				"value": this.divStatsBlock.querySelector(".score-label").innerText
			},
			{
				"type": "users",				
				"element": {
					//DISCLAIMER: The value is in .fl-l.score "data-user" attribute
					"statsBlock": this.divStatsBlock.querySelector(".fl-l.score"),					
					"leftSide": this.getSidebarTextNode("users")
				},				
				"value": this.divStatsBlock.querySelector(".fl-l.score").getAttribute("data-user")
			},
			{
				"type": "rank",
				"element": {
					"statsBlock": this.divStatsBlock.querySelector(".numbers.ranked strong"),
					"leftSide": this.getSidebarTextNode("ranked")

				},				
				"value": this.divStatsBlock.querySelector(".numbers.ranked strong").innerText
			},
			{
				"type": "popularity",
				"element": {
					"statsBlock": this.divStatsBlock.querySelector(".numbers.popularity strong"),
					"leftSide": this.getSidebarTextNode("popularity")
				},				
				"value": this.divStatsBlock.querySelector(".numbers.popularity strong").innerText
			},
			{
				"type": "members",
				"element": {
					"statsBlock": this.divStatsBlock.querySelector(".numbers.members strong"),
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
				"value": this.getSidebarTextNode("favorites").textContent
			},
	    ];	    
	    //calling the function that hides the scores
	    this.statsBlockHideScores();

	    //stats-block visible again!
	    this.divStatsBlock.style.opacity = "1";

	    // console.log("random stuff");
	    // console.log(this.getSidebarTextNode("favorites"));
	}	

	//hides the scores
	statsBlockHideScores(){					
		//iterating through each type of score and hiding all values
		for(let i=0; i < this.scoreDetails.length; i++){						
			let element = this.scoreDetails[i].element.statsBlock;
			//since the "users" score is an attribute, we need to hide the value differently.
			if(this.scoreDetails[i].type == "users")
				element.setAttribute("data-user", `${this.scorePlaceholder} users`);			
			else if(this.scoreDetails[i].type != "favorites")
				//"favorites" is from the left side bar, so it doesn't have a statsBlock value
				element.replaceChildren(this.scorePlaceholder);			
		}
			
	}

	sideBarHideScores(){

	}


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
			//The text is inside the div, with no way of directly indetifying it
			//Therefore, we need to get the NODE related to the text itself
			let value = Array.from(element.childNodes).filter((node)=>{
				//nodeType 3 directly refers to TEXT nodes
				return node.nodeType == 3 
					   && node.textContent.replace("\n", "").trim();
					   //Some of the nodes from the .spaceit_pad are simply "\n"
					   //With this, we make sure we get ONLY the node with the text we want
			});

			//Specifically for the "users", there are two text nodes. And we want the LAST node.
			//for the other stats, there's only one node, so we can safely use position 0
			value = value[(elementName == "users") ? 1 : 0];							

			return value;			
		}
		//if the element is undefined, return null
		//most likely an invalid elementName was informed 
		return null;
		
	}
	
}

//instanciating the ScoreHider class, making it execute the commands.
let score = new ScoreHider();


