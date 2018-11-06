import * as _ from "underscore";
import AccessControlService from '../../../services/AccessControlService';
import { EntityAccessControlService } from './EntityAccessControlService';
import { Component, Input, Inject, OnInit, SimpleChanges } from '@angular/core';
import UserGroupService from '../../../services/UserGroupService';
import { ObjectUtils } from '../../../common/utils/object-utils';

@Component({
    selector: 'entity-access-control',
    templateUrl: 'js/feed-mgr/shared/entity-access-control/entity-access-control.html'
})
export class EntityAccessControlComponent implements OnInit {

    /**
    * are we using Entity access control
    * @type {boolean}
    */

    @Input() readOnly: boolean;
    @Input() theForm: any;
    @Input() roleMembershipsProperty: string;
    @Input() entityType:string;
    @Input() allowOwnerChange: boolean;
    @Input() entity: any;
    @Input() queryForEntityAccess: any;

    enabled: boolean = false;
    entityRoleMemberships: any;
    rolesInitialized: any;
    ownerAutoComplete: any;
    /**
    * Cache of the group names for filtering
    * @type {null}
    */
    allGroups: any = null;
    /**
    * Cache of the user names for filtering
    * @type {null}
    */
    allUsers: any = null;

    roles: any = null;

    ngOnInit() {
        
        if(ObjectUtils.isUndefined(this.readOnly)){
            this.readOnly = false;
        }

        if(ObjectUtils.isUndefined(this.theForm)){
            this.theForm = {};
        }

        if(ObjectUtils.isUndefined(this.roleMembershipsProperty)){
            this.roleMembershipsProperty = "roleMemberships";
        }

        if(ObjectUtils.isUndefined(this.allowOwnerChange)){
            this.allowOwnerChange = true;
        }

        this.$injector.get("$q").when(this.accessControlService.checkEntityAccessControlled()).then(() => {
            this.enabled = this.accessControlService.isEntityAccessControlled();
        });


        if (ObjectUtils.isUndefined(this.entity[this.roleMembershipsProperty])) {
            this.entity[this.roleMembershipsProperty] = [];
        }

        this.entityRoleMemberships = this.entity[this.roleMembershipsProperty];


        if (ObjectUtils.isUndefined(this.queryForEntityAccess)) {
            this.queryForEntityAccess = false;
        }

        if (ObjectUtils.isUndefined(this.entity.owner) || this.entity.owner == null) {
            this.entity.owner = null;
            //assign it the current user
            var requests = { currentUser: this.UserGroupService.getCurrentUser(), allUsers: this.getAllUsers() };
            this.$injector.get("$q").all(requests).then((response: any) => {
                var matchingUsers = this.filterCollection(response.allUsers, response.currentUser.systemName, ['_lowerDisplayName', '_lowerSystemName']);
                if (matchingUsers) {
                    this.entity.owner = matchingUsers[0];
                }
            })
        }

        /**
         * Flag that the user has updated the role memberships
         * @type {boolean}
         */
        this.entity.roleMembershipsUpdated = ObjectUtils.isUndefined(this.entity.roleMembershipsUpdated) ? false : this.entity.roleMembershipsUpdated;

        /**
         * Flag to indicate we should query for the roles from the server.
         * If the entity has already been marked as being updated then mark this as initialized so it doesnt loose the in-memory settings the user has applied
         * @type {boolean}
         */
        this.rolesInitialized = this.queryForEntityAccess == true ? false : (this.entity.roleMembershipsUpdated == true ? true : false);


        /**
         * Owner autocomplete model
         * @type {{searchText: string, searchTextChanged: controller.ownerAutoComplete.searchTextChanged, selectedItemChange: controller.ownerAutoComplete.selectedItemChange}}
         */
        this.ownerAutoComplete = {
            searchText: '',
            searchTextChanged: (query: any) => { },
            selectedItemChange: (item: any) => {
                if (item != null && item != undefined) {
                    this.entity.owner = item;
                }
                else {
                    this.entity.owner = null;
                }

            }
        }
        this.init();
    }

    constructor(private UserGroupService: UserGroupService,
                private entityAccessControlService: EntityAccessControlService, 
                private accessControlService: AccessControlService,
                @Inject("$injector") private $injector: any) {}

    /**
     * Filter the groups or users based upon the supplied query
     * @param collection
     * @param query
     * @returns {Array}
     */
    filterCollection (collection: any, query: any, keys: any) {
        return query ? _.filter(collection, (item) => {
            var lowercaseQuery = query.toLowerCase();
            var found = _.find(keys, (key: any) => {
                return (item[key].indexOf(lowercaseQuery) === 0);
            });
            if (found != undefined) {
                return true;
            }
            else {
                return false;
            }
        }) : [];
    }

    /**
     * Query users and groups
     * @param query
     */
    queryUsersAndGroups (query: any) {
        this.entity.roleMembershipsUpdated = true;
        var df = this.$injector.get("$q").defer();
        var request = { groups: this.getAllGroups(), users: this.getAllUsers() };
        this.$injector.get("$q").all(request).then((results: any) => {
            var groups = results.groups;
            var users = results.users;
            var matchingGroups = this.filterCollection(groups, query, ['_lowername']);
            var matchingUsers = this.filterCollection(users, query, ['_lowerDisplayName', '_lowerSystemName']);
            var arr = matchingGroups.concat(matchingUsers);
            df.resolve(arr);
        });
        return df.promise;
    }

    /**
     * If an attempt is made to remove a non-editable member of a role membership then
     * re-add that member to the membership set.
     */
    onRemovedMember (member: any, members: any) {
        if (member.editable == false) {
            members.unshift(member);
        }
    };

    /**
     * Query users
     * @param query
     */
    queryUsers (query: any) {
        var df = this.$injector.get("$q").defer();
        this.getAllUsers().then((users: any) => {
            var matchingUsers = this.filterCollection(users, query, ['_lowerDisplayName', '_lowerSystemName']);
            df.resolve(matchingUsers);
        });
        return df.promise;
    }


    getAllGroups () {
        var df = this.$injector.get("$q").defer();
        if (this.allGroups == null) {
            // Get the list of groups
            this.UserGroupService.getGroups()
                .then((groups: any) => {
                    this.allGroups = _.map(groups, (item: any) => {
                        item._lowername = (item.title == null || ObjectUtils.isUndefined(item.title)) ? item.systemName.toLowerCase() : item.title.toLowerCase();
                        item.type = 'group'
                        return item;
                    });
                    df.resolve(this.allGroups);
                });
        }
        else {
            df.resolve(this.allGroups);
        }
        return df.promise;
    };

    getAllUsers () {
        var df = this.$injector.get("$q").defer();
        if (this.allUsers == null) {
            // Get the list of groups
            this.UserGroupService.getUsers()
                .then((users: any) => {
                    this.allUsers = _.map(users, (user: any) => {
                        var name = (ObjectUtils.isString(user.displayName) && user.displayName.length > 0) ? user.displayName : user.systemName;
                        user.name = name;
                        user.displayName = name;
                        user.title = name;
                        user.type = 'user';
                        user._lowername = name.toLowerCase();
                        user._lowerSystemName = user.systemName.toLowerCase()
                        user._lowerDisplayName = ObjectUtils.isString(user.displayName) ? user.displayName.toLowerCase() : '';
                        return user;
                    });
                    //     var result = filterCollection(allUserNamesLowerCase,query,['_lowerDisplayName','_lowerSystemName']);
                    df.resolve(this.allUsers);
                });
        }
        else {
            df.resolve(this.allUsers);
        }
        return df.promise;
    };

    init () {
        if (this.rolesInitialized == false) {
            this.$injector.get("$q").when(this.entityAccessControlService.mergeRoleAssignments(this.entity, this.entityType, this.entity[this.roleMembershipsProperty]))
                .then(() => {
                    this.rolesInitialized = true;
                    this.entityRoleMemberships = this.entity[this.roleMembershipsProperty];
                });
        }
    };
}

