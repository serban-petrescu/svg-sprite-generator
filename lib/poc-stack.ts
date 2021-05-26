import { Runtime } from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { HttpApi } from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import {
  CfnOutput,
  Construct,
  Duration,
  Stack,
  StackProps,
} from "@aws-cdk/core";

export class PocStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const backend = new NodejsFunction(this, "Backend", {
      runtime: Runtime.NODEJS_14_X,
      timeout: Duration.minutes(1),
      bundling: {
        loader: {
          ".html": "text",
        },
      },
    });

    const api = new HttpApi(this, "Api", {
      defaultIntegration: new LambdaProxyIntegration({
        handler: backend,
      }),
    });

    new CfnOutput(this, "Link", {
      value: api.url || "",
    });
  }
}
