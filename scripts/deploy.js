const hre = require("hardhat");

async function main() {

  const RegisterUsers = await hre.ethers.getContractFactory("RegisterUsers");
  const Register = await RegisterUsers.deploy();
  await Register.deployed();

  const DealContract = await hre.ethers.getContractFactory("DealContract");
  const deal = await DealContract.deploy(Register.address);
  await deal.deployed();

  const DealSubscription = await hre.ethers.getContractFactory("DealSubscription");
  const sub = await DealSubscription.deploy(Register.address, deal.address);

  await sub.deployed();

  const VoteRequest = await hre.ethers.getContractFactory("VoteRequest");
  const vote = await VoteRequest.deploy(Register.address, deal.address);

  await vote.deployed();

  const DirectTokenFactory = await hre.ethers.getContractFactory("DirectTokenFactory");
  const factory = await DirectTokenFactory.deploy();

  await factory.deployed();


  console.log(
    ` deployed to  Registration- ${Register.address} Deal- ${deal.address} Subscription- ${sub.address}  Vote- ${vote.address} Factory- ${factory.address} `
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
