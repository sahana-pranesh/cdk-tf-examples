import { Construct } from "constructs";
import { App, RemoteBackend, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { ApplicationVpc } from "./modules/ApplicationVpc";

class LmsStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "AWS", {
      region: "us-west-1",
    });

    new ApplicationVpc(app, "Network", {
      name: 'lms-vpc',
      cidr: '10.0.0.0/21',
      azs: ['us-west-1a', 'us-west-1c'],
      publicSubnets: ['10.0.101.0/24', '10.0.102.0/24'],
      databaseSubnets: ['10.0.103.0/24', '10.0.104.0/24'],
      privateSubnets: ['10.0.105.0/24', '10.0.106.0/24'],
      securityGroupName: 'lms-sg'
    });
  }
}

const app = new App();
const stack = new LmsStack(app, "learning-management");

new RemoteBackend(stack, {
  hostname: "app.terraform.io",
  organization: "sahana-test",
  workspaces: {
    name: "cdktf",
  },
});

app.synth();
