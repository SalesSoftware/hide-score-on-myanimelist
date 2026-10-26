/**
 * This class has the purpose of interacting with the browser.storage.sync system. Retrieving and setting values in storage.
 */
class StorageSync{

    /**
     * Searches for the "scorehider_settings" position in storage, and returns the value it finds
     * @returns {Promise< * | {error: Error}>} - returns the value of the requested element, or an error if it exists
     */
    getFromStorage(elementName){
        //return browser.storage.sync.get("scorehider_settings").then(
        //return Promise.reject(new Error("Simulated error2")).then(
        return browser.storage.sync.get("scorehider_settings").then(
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
                console.log("updated storage succesfully");
                success = true;
            }
        ).catch(
            (error)=>{errorMsg = error}
        );
        return {"success": success, "error": errorMsg};
    }

    /**
     * Returns all values from storage.
     * This method is intended for debugging purposes.
     * @returns {Promise<Object>} - Every single object in storage
     */
    getAllStorage(){
        return browser.storage.sync.get(null).then(data => data);
    }
}
