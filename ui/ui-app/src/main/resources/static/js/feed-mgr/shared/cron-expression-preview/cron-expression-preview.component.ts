
import * as _ from "underscore";
import { RestUrlService } from '../../services/RestUrlService';
import { Inject, Input, Component, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'cron-expression-preview',
    templateUrl: 'js/feed-mgr/shared/cron-expression-preview/cron-expression-preview.html',
    styleUrls: ['js/feed-mgr/shared/cron-expression-preview/cron-expression-preview.css']
})
export class CronExpressionPreview {
    
    nextDates : any[] = [];
    @Input() cronExpression : any;

    ngOnInit() {
        this.getNextDates();
    }

    ngOnChanges(changes: SimpleChanges) {
        if(changes.cronExpression.currentValue != null && changes.cronExpression.currentValue != ''){
            this.getNextDates();
        }
        else {
            this.nextDates = [];
        }
        
    }
    constructor(private RestUrlService:RestUrlService,
                private http: HttpClient) {}

    getNextDates() {
        this.http.get(this.RestUrlService.PREVIEW_CRON_EXPRESSION_URL,{params:{cronExpression:this.cronExpression}})
            .toPromise().then( (response:any) => {
            this.nextDates = response;
        });
    }
}