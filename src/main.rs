use lambda_http::aws_lambda_events::apigw::{ApiGatewayCustomAuthorizerRequestTypeRequest, ApiGatewayCustomAuthorizerResponse, ApiGatewayCustomAuthorizerPolicy};
use lambda_runtime::{handler_fn, Context, Error as LambdaError};
use serde_json::{json, Value};

#[tokio::main]
async fn main() -> Result<(), LambdaError> {
    let function = handler_fn(handler);
    lambda_runtime::run(function).await?;
    Ok(())
}

async fn handler(
    event: ApiGatewayCustomAuthorizerRequestTypeRequest,
    _: Context
) -> Result<Value, LambdaError> {
    let method_arn = event.method_arn;

    // TODO - implement auth function and call, return result
    let response = ApiGatewayCustomAuthorizerResponse {
        principal_id: Some(String::from("principal_id")),
        policy_document: ApiGatewayCustomAuthorizerPolicy {
            version: Some(String::from("version")),
            statement: vec![]
        },
        context: {
        },
        usage_identifier_key: Some(String::from("key"))
    };
    Ok(json!(response))
}
