import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
export interface EventMasterStackProps extends cdk.StackProps {
    environment: string;
}
export declare class EventMasterStack extends cdk.Stack {
    readonly api: apigateway.RestApi;
    readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;
    constructor(scope: Construct, id: string, props: EventMasterStackProps);
}
