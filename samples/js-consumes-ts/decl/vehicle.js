/**
 * A vehicle is a thing that goes places
 */
export default class Vehicle {
    /**
     * Create a new vehicle
     * @param {number} numWheels Number of wheels
     */
    constructor(numWheels) {
        this.numWheels = numWheels;
    }
    /**
     * Drive the vehicle
     * @returns {string}
     */
    drive() {
        return `Driving with all ${this.numWheels} wheels`;
    }
}
