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
				"element": this.divStatsBlock.querySelector(".score-label"),
				"value": this.divStatsBlock.querySelector(".score-label").innerText
			},
			{
				"type": "users",
				//DISCLAIMER: The value is in .fl-l.score "data-user" attribute
				"element": this.divStatsBlock.querySelector(".fl-l.score"),
				"value": this.divStatsBlock.querySelector(".fl-l.score").getAttribute("data-user")
			},
			{
				"type": "rank",
				"element": this.divStatsBlock.querySelector(".numbers.ranked strong"),
				"value": this.divStatsBlock.querySelector(".numbers.ranked strong").innerText
			},
			{
				"type": "popularity",
				"element": this.divStatsBlock.querySelector(".numbers.popularity strong"),
				"value": this.divStatsBlock.querySelector(".numbers.popularity strong").innerText
			},
			{
				"type": "members",
				"element": this.divStatsBlock.querySelector(".numbers.members strong"),
				"value": this.divStatsBlock.querySelector(".numbers.members strong").innerText
			},
	    ];

	    //calling the function that hides the scores
	    this.hideScores();

	    //stats-block visible again!
	    this.divStatsBlock.style.visibility = "visible";
	}	

	//hides the scores
	hideScores(){			
		this.scorePlaceholder = "?"; //The text that will replace the scores

		//iterating through each type of score and hiding all values
		for(let i=0; i < this.scoreDetails.length; i++){
			//since the "users" score is an attribute, we need to hide the value differently.
			if(this.scoreDetails[i].type == "users")
				this.scoreDetails[i].element.setAttribute("data-user", `${this.scorePlaceholder} users`);
			else
				this.scoreDetails[i].element.replaceChildren(this.scorePlaceholder);			
		}
			
	}
	
}
//instanciating the ScoreHider class, making it execute the commands.
score = new ScoreHider();
