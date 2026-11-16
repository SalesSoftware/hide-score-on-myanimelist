/**
 * This class has the purpose of interacting with the browser.storage.sync system. Retrieving and setting values in storage.
 */
class StorageSync{

    /**
     * Searches for the "scorehider_settings" position in storage, and returns the value it finds
     * @returns {Promise< * | {error: Error}>} - returns the value of the requested element, or an error if it exists
     */
    async getFromStorage(elementName){
        //return browser.storage.sync.get(elementName).then(
        //return Promise.reject(new Error("Simulated error2")).then(
        return browser.storage.sync.get(elementName).then(
            (value)=> value[elementName],
        ).catch(
            (error)=>{return {error}}
        );
    }

    /**
     * sets the informed value in storage
     * then returns an object saying if the value was succesfully set or not
     *
     * @async
     * @param {Object} value - The value that's going to be stored.  It needs to be in this format: {"NameOfTheElement": value}
     * @returns {Promise<{"success": true, "error": undefined} | {"success": false, "error": Error}>}
     */
    async setInStorage(value){
        let success = false;
        let errorMsg = undefined;

        //await browser.storage.sync.set(value).then(
        //await Promise.reject(new Error("Simulated error2")).then(
        await browser.storage.sync.set(value).then(
            ()=>{
                console.log("updated storage succesfully", value);
                success = true;
            }
        ).catch(
            (error)=>{errorMsg = error}
        );
        return {"success": success, "error": errorMsg};
    }

    /**
     *  Makes an array of every single stat, and stores this array in the "scorehider_settings" position of storage
     *  by calling {@link setInStorage()}.
     *  This method was moved to here from {@link ScoreHider} so {@link PopupMenu} can also have access to it.
     *
     *  @async
     *  @returns {Promise<
     * 		{"success": true, "error": undefined, "dataStored": [...]} |
     *  	{"success": false, "error": Error}
     *  >}
     *  - Returns the value of {@link setInStorage()}, but attaches "dataStored" to the Object if the storage was successful
     */
    async setSettingsFirstUse(){

        //creating list that we're going to store
        let dataToStore = {
            //by default we hide every single stat
            "scorehider_settings": [
                "recommended",
                "mixed",
                "not_recommended",
                "review_amount",
                "ratio_bar",
                "favorites",
                "members",
                "popularity",
                "rank",
                "users",
                "score"
            ]
        };

        let result = await this.setInStorage(dataToStore); //storing settings
        if(result.success)
            result.dataStored = dataToStore;

        return result;
    }

    /**
     * Returns all values from storage.
     * This method is intended for debugging purposes.
     * @returns {Promise<Object>} - Every single object in storage
     */
    async getAllStorage(){
        return browser.storage.sync.get(null).then(data => data);
    }
}
