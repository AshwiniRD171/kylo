
import * as _ from "underscore";
import AddButtonService from '../../services/AddButtonService';
import { DomainTypesService } from '../services/DomainTypesService';
import { Component } from "@angular/core";
import StateService from "../../services/StateService";
import { FeedFieldPolicyRuleService } from "../shared/feed-field-policy-rules/services/FeedFieldPolicyRuleService";
import { MatSnackBar } from "@angular/material/snack-bar";

/**
 * Identifier for this page.
 * @type {string}
 */
const PAGE_NAME = "domain-types";

@Component({
    selector:'domain-types-component',
    templateUrl:'js/feed-mgr/domain-types/domain-types.html'
})
export class DomainTypesComponent {

    /**
    * List of domain types.
    * @type {DomainType[]}
    */
    domainTypes: any[] = [];
    /**
    * Indicates that the table data is being loaded.
    * @type {boolean}
    */
    loading: boolean = true;
    /**
    * Query for filtering categories.
    * @type {string}
    */
    searchQuery: string = "";

    ngOnInit() {
        // Register Add button
        this.addButtonService.registerAddButton(PAGE_NAME, () => {
            this.StateService.FeedManager().DomainType().navigateToDomainTypeDetails();
        });

        // Fetch domain types
        this.domainTypesService.findAll()
            .then((domainTypes: any) => {
                this.domainTypes = domainTypes;
                this.loading = false;
            }, () => {
                this.snackBar.open('Unable to load domain types.','OK',{duration : 3000});
            });
    }

    /**
     * Controller for the domain-types page.
     *
     * @constructor
     */
    constructor(private addButtonService: AddButtonService, 
                private domainTypesService: DomainTypesService, 
                private FeedFieldPolicyRuleService: FeedFieldPolicyRuleService,
                private StateService: StateService,
                private snackBar: MatSnackBar) {

    }
    /**
 * Navigates to the domain type details page for the specified domain type.
 */
    editDomainType (domainType: any) {
        this.StateService.FeedManager().DomainType().navigateToDomainTypeDetails(domainType.id);
    };

    /**
     * Gets a list of all field policies for the specified domain type.
     */
    getAllFieldPolicies (domainType: any) {
        var rules = this.FeedFieldPolicyRuleService.getAllPolicyRules(domainType.fieldPolicy);
        return (rules.length > 0) ? rules.map(_.property("name")).join(", ") : "No rules";
    };

    /**
     * Indicates if the specified domain type has any field policies.
     */
    hasFieldPolicies (domainType: any) {
        return (domainType.fieldPolicy.standardization.length > 0 || domainType.fieldPolicy.validation.length > 0);
    };

}

