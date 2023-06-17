import * as cdk from "aws-cdk-lib";
import { EndpointType, IdentitySource, RequestAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export class DeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const globalDeny = ManagedPolicy.fromManagedPolicyName(this, "global-deny", "cloud-services/cloud-services-global-deny")
    const sharedGlobalDeny = ManagedPolicy.fromManagedPolicyName(
      this,
      "shared-global-deny",
      "cloud-services/cloud-services-shared-global-deny"
    )
    const lambdaExecutionRole = ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")

    const lambdaRole = new Role(this, "LambdaRole", {
      roleName: "rust-lambda-role",
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [globalDeny, sharedGlobalDeny, lambdaExecutionRole]
    })

    const authorizerTable = new Table(this, "AuthorizerTable", {
      tableName: "rust-authorizer-table",
      partitionKey: { name: "PK", type: AttributeType.STRING },
      sortKey: { name: "modelTypeAndId", type: AttributeType.STRING }
    })
    authorizerTable.addGlobalSecondaryIndex({
      indexName: "ModelTypeAndIdIndex",
      partitionKey: { name: "modelTypeAndId", type: AttributeType.STRING }
    })

    const api = new RestApi(this, "RestApi", {
      cloudWatchRole: false,
      restApiName: "rust-api",
      endpointTypes: [EndpointType.REGIONAL]
    })

    const authorizerLambda = new Function(this, "AuthorizerHandler", {
      functionName: "rust-authorizer-lambda",
      runtime: Runtime.PROVIDED_AL2,
      role: lambdaRole,
      code: Code.fromAsset("../target/x86_64-unknown-linux-musl/release/lambda.zip"),
      handler: "main",
      environment: {
      }
    })
    authorizerLambda.grantInvoke(new ServicePrincipal("apigateway.amazonaws.com"))
    authorizerTable.grantReadData(authorizerLambda)

    const requestAuthorizer = new RequestAuthorizer(this, "RequestAuthorizer", {
      handler: authorizerLambda,
      identitySources: [IdentitySource.header("x-authorizer-cache-key")],
      resultsCacheTtl: cdk.Duration.seconds(300)
    })
  }
}
