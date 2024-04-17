const content = `Title: The Power of Cloud Computing: Accessing IT Resources Made Easy

Post: Are you tired of the hassle and cost of managing hardware for your IT resources? Look no further than cloud computing! With a cloud services platform, you can access compute power, storage, and applications over the internet in a convenient and cost-effective way.

The pay-as-you-go model of cloud computing means you only pay for what you use, allowing for rapid access to flexible resources without the need for large upfront investments in hardware. Whether you are a small business owner or supporting a large-scale operation, cloud computing offers the right type and size of resources needed to power your projects.

The convenience of cloud computing doesn't stop there - you can easily scale up or down based on your current needs, eliminating the heavy lifting of managing hardware. This allows for quick provisioning of resources, making it a convenient and efficient solution for accessing IT resources whether you are launching a new project or running day-to-day operations.

Say goodbye to the headaches of hardware management and hello to the power of cloud computing!`;

const [title, post] = content.split("Post:");

console.log("title : ", title);

const parsedTitle = title.split("Title: ")[1];

console.log("parsedTitle : ", parsedTitle);

console.log("post : ", post);

// const parsedPost = post.split("Post: ")[1].trim();

// console.log("parsedPost : ", parsedPost);
