exports.getBlogPage = (req, res) => {
  // Get page number from query parameters (default to page 1)
  const page = parseInt(req.query.page) || 1;
  const postsPerPage = 6;

  // Mock blog post data - in a real app, this would come from a database
  const allPosts = [
    {
      id: 1,
      slug: "future-of-logistics-technology",
      title: "The Future of Logistics Technology in 2023 and Beyond",
      category: "Technology",
      date: "June 15, 2023",
      author: "John Smith",
      commentCount: 8,
      image:
        "https://images.unsplash.com/photo-1504376379689-8d54347b26c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80",
      excerpt:
        "Explore the emerging technologies that are transforming the logistics industry, from AI-powered supply chain optimization to blockchain for transparent tracking.",
    },
    {
      id: 2,
      slug: "sustainable-shipping-practices",
      title: "Sustainable Shipping Practices for Eco-Conscious Businesses",
      category: "Sustainability",
      date: "May 28, 2023",
      author: "Sarah Johnson",
      commentCount: 12,
      image:
        "https://images.unsplash.com/photo-1516937941344-00b4e0337589?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      excerpt:
        "Discover how businesses are reducing their carbon footprint with eco-friendly shipping alternatives, renewable packaging solutions, and optimized transportation routes.",
    },
    {
      id: 3,
      slug: "global-supply-chain-resilience",
      title: "Building Resilience in Global Supply Chains After the Pandemic",
      category: "Supply Chain",
      date: "May 12, 2023",
      author: "Michael Chen",
      commentCount: 5,
      image:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      excerpt:
        "Learn how companies are redesigning their supply chains to withstand future disruptions, incorporating redundancy, flexibility, and localized production.",
    },
    {
      id: 4,
      slug: "last-mile-delivery-innovations",
      title: "Innovations in Last-Mile Delivery for Urban Areas",
      category: "Delivery",
      date: "April 25, 2023",
      author: "Emily Patel",
      commentCount: 7,
      image:
        "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      excerpt:
        "Explore creative solutions for the most challenging part of the delivery process: the last mile. From micro-fulfillment centers to autonomous delivery vehicles.",
    },
    {
      id: 5,
      slug: "cross-border-shipping-challenges",
      title:
        "Navigating Cross-Border Shipping Challenges in a Post-Brexit World",
      category: "International",
      date: "April 10, 2023",
      author: "Robert Williams",
      commentCount: 10,
      image:
        "https://images.unsplash.com/photo-1619539465730-fea9ebf950f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      excerpt:
        "A comprehensive guide to handling customs, tariffs, and regulatory changes affecting cross-border shipping between the UK, EU, and beyond.",
    },
    {
      id: 6,
      slug: "warehouse-automation-trends",
      title:
        "Warehouse Automation Trends: From Robots to AI-Powered Management",
      category: "Warehouse",
      date: "March 28, 2023",
      author: "Sophia Rodriguez",
      commentCount: 6,
      image:
        "https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      excerpt:
        "How modern warehouses are leveraging robotics, AI, and IoT to increase efficiency, reduce costs, and handle growing e-commerce demand.",
    },
    {
      id: 7,
      slug: "cold-chain-logistics-pharmaceutical",
      title:
        "Cold Chain Logistics: Ensuring Integrity in Pharmaceutical Transportation",
      category: "Healthcare",
      date: "March 15, 2023",
      author: "David Thompson",
      commentCount: 4,
      image:
        "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80",
      excerpt:
        "The critical role of temperature-controlled logistics in pharmaceutical distribution, and the technologies ensuring product integrity throughout the supply chain.",
    },
    {
      id: 8,
      slug: "logistics-workforce-challenges",
      title: "Addressing Workforce Challenges in the Logistics Industry",
      category: "Industry",
      date: "February 28, 2023",
      author: "Olivia White",
      commentCount: 9,
      image:
        "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
      excerpt:
        "Strategies for recruiting, training, and retaining talent in logistics, while balancing automation and human workforce needs in a changing industry.",
    },
    {
      id: 9,
      slug: "data-analytics-logistics-optimization",
      title: "Leveraging Data Analytics for Logistics Optimization",
      category: "Technology",
      date: "February 14, 2023",
      author: "John Smith",
      commentCount: 7,
      image:
        "https://images.unsplash.com/photo-1575503802870-45bcd45f1b71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      excerpt:
        "How big data, predictive analytics, and machine learning are helping logistics companies make smarter decisions and drive operational improvements.",
    },
  ];

  // Calculate pagination values
  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const startIndex = (page - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const posts = allPosts.slice(startIndex, endIndex);

  res.render("blog/index", {
    title: "Our Blog",
    path: "/blog",
    blogs: posts,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
    },
  });
};

exports.getBlogDetailsPage = (req, res) => {
  const blogSlug = req.params.slug;

  // Mock blog post data - in a real app, this would come from a database
  const posts = {
    "future-of-logistics-technology": {
      id: 1,
      slug: "future-of-logistics-technology",
      title: "The Future of Logistics Technology in 2023 and Beyond",
      category: "Technology",
      date: "June 15, 2023",
      author: "John Smith",
      authorPosition: "CEO & Founder",
      authorImage:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80",
      commentCount: 8,
      image:
        "https://images.unsplash.com/photo-1504376379689-8d54347b26c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80",
      content: `<p>The logistics industry is on the cusp of a technological revolution that promises to transform how goods are moved, stored, and delivered across the globe. As we navigate through 2023 and look toward the future, several key technologies are driving this transformation.</p>

      <h3>Artificial Intelligence and Machine Learning</h3>
      
      <p>AI and machine learning are perhaps the most significant technologies reshaping logistics. These technologies are being applied across the supply chain in various ways:</p>
      
      <ul>
        <li><strong>Demand Forecasting:</strong> AI algorithms can analyze historical data, market trends, seasonal patterns, and even social media sentiment to predict demand with unprecedented accuracy, allowing companies to optimize inventory levels and reduce waste.</li>
        
        <li><strong>Route Optimization:</strong> Machine learning models can process real-time data on traffic, weather, and other factors to optimize delivery routes, reducing fuel consumption and delivery times.</li>
        
        <li><strong>Warehouse Management:</strong> AI-powered systems can optimize warehouse layouts, picking routes, and staffing levels based on order patterns and inventory positions.</li>
        
        <li><strong>Predictive Maintenance:</strong> By analyzing data from sensors on vehicles and equipment, AI can predict when maintenance will be needed, preventing costly breakdowns and extending asset lifespans.</li>
      </ul>
      
      <h3>Internet of Things (IoT)</h3>
      
      <p>The proliferation of IoT devices is creating a connected logistics ecosystem where real-time data flows seamlessly between different nodes in the supply chain:</p>
      
      <ul>
        <li><strong>Asset Tracking:</strong> IoT sensors enable real-time tracking of shipments, providing visibility into location, condition, and estimated arrival times.</li>
        
        <li><strong>Condition Monitoring:</strong> Sensors can monitor temperature, humidity, light exposure, and shock, ensuring that sensitive goods like pharmaceuticals and food items remain in optimal conditions throughout transit.</li>
        
        <li><strong>Fleet Management:</strong> IoT devices in vehicles can track performance metrics, driving behavior, and fuel consumption, enabling more efficient fleet operations.</li>
      </ul>
      
      <h3>Blockchain for Supply Chain Transparency</h3>
      
      <p>Blockchain technology is addressing one of the most persistent challenges in logistics: the need for transparency and trust across complex supply chains:</p>
      
      <ul>
        <li><strong>Provenance Tracking:</strong> Blockchain creates an immutable record of a product's journey from origin to destination, valuable for verifying authenticity and ethical sourcing.</li>
        
        <li><strong>Smart Contracts:</strong> These self-executing contracts can automate payments and other actions when predefined conditions are met, streamlining processes and reducing paperwork.</li>
        
        <li><strong>Documentation Management:</strong> Blockchain can securely store and share shipping documents, reducing delays and fraud in international shipping.</li>
      </ul>
      
      <h3>Autonomous Vehicles and Drones</h3>
      
      <p>While full autonomy in transportation is still evolving, significant progress is being made:</p>
      
      <ul>
        <li><strong>Autonomous Trucks:</strong> Semi-autonomous trucks are already operating on highways, and fully autonomous models are being tested. These promise to address driver shortages and improve safety.</li>
        
        <li><strong>Delivery Drones:</strong> Companies are developing drone delivery systems for last-mile delivery in urban areas, potentially reducing congestion and delivery times.</li>
        
        <li><strong>Warehouse Robots:</strong> Autonomous mobile robots (AMRs) and robotic picking systems are transforming warehouse operations, increasing speed and accuracy.</li>
      </ul>
      
      <h3>Augmented Reality (AR) and Virtual Reality (VR)</h3>
      
      <p>AR and VR technologies are finding practical applications in logistics:</p>
      
      <ul>
        <li><strong>Warehouse Operations:</strong> AR glasses can guide warehouse workers to item locations and provide picking instructions, improving efficiency and reducing errors.</li>
        
        <li><strong>Training:</strong> VR can create immersive training environments for tasks like operating forklifts or loading trucks, making training safer and more effective.</li>
        
        <li><strong>Facility Planning:</strong> VR allows logistics planners to design and visualize warehouse layouts and workflows before implementation.</li>
      </ul>
      
      <h3>3D Printing and On-Demand Manufacturing</h3>
      
      <p>3D printing technology has the potential to radically reshape logistics networks:</p>
      
      <ul>
        <li><strong>Distributed Manufacturing:</strong> Instead of shipping finished products globally, designs could be transmitted digitally and manufactured locally, reducing transportation needs.</li>
        
        <li><strong>Spare Parts:</strong> Critical spare parts could be printed on-demand at service locations, reducing inventory costs and downtime.</li>
      </ul>
      
      <h3>Challenges and Considerations</h3>
      
      <p>While these technologies offer tremendous potential, their implementation comes with challenges:</p>
      
      <ul>
        <li><strong>Integration:</strong> Many logistics operations involve legacy systems that are difficult to integrate with new technologies.</li>
        
        <li><strong>Data Security:</strong> As logistics becomes more digital, protecting sensitive data becomes increasingly important.</li>
        
        <li><strong>Regulatory Compliance:</strong> Emerging technologies often outpace regulatory frameworks, creating uncertainty for adopters.</li>
        
        <li><strong>Workforce Transformation:</strong> As automation increases, the logistics workforce will need to adapt and develop new skills.</li>
      </ul>
      
      <h3>Conclusion</h3>
      
      <p>The future of logistics technology is not just about automation and efficiency—it's about creating more resilient, transparent, and sustainable supply chains. Companies that embrace these technologies strategically will be well-positioned to thrive in an increasingly complex and demanding logistics landscape.</p>
      
      <p>At Dxpress Logistics, we're committed to staying at the forefront of these technological advances, helping our clients navigate the changing landscape and leverage innovation for competitive advantage.</p>`,
      tags: [
        "Technology",
        "Innovation",
        "AI",
        "Blockchain",
        "Autonomous Vehicles",
      ],
      comments: [
        {
          id: 1,
          name: "Mike Johnson",
          email: "mike@example.com",
          date: "June 16, 2023",
          content:
            "Great article! I particularly agree with your points about AI and machine learning. We've implemented predictive analytics in our distribution center and seen a 30% improvement in efficiency.",
        },
        {
          id: 2,
          name: "Rachel Lee",
          email: "rachel@example.com",
          date: "June 17, 2023",
          content:
            "I'm curious about the practical timeline for autonomous truck adoption. Are there specific regulatory hurdles that you see as the biggest obstacles?",
        },
        {
          id: 3,
          name: "David Chen",
          email: "david@example.com",
          date: "June 18, 2023",
          content:
            "The blockchain section was particularly insightful. We've been exploring blockchain for product authentication in our pharmaceutical supply chain. Have you seen any successful large-scale implementations in that sector?",
        },
      ],
    },
    "sustainable-shipping-practices": {
      id: 2,
      slug: "sustainable-shipping-practices",
      title: "Sustainable Shipping Practices for Eco-Conscious Businesses",
      category: "Sustainability",
      date: "May 28, 2023",
      author: "Sarah Johnson",
      authorPosition: "Operations Director",
      authorImage:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=988&q=80",
      commentCount: 12,
      image:
        "https://images.unsplash.com/photo-1516937941344-00b4e0337589?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      content: `<p>As businesses increasingly prioritize sustainability in their operations, shipping and logistics have emerged as critical areas for reducing environmental impact. The transportation sector accounts for approximately 14% of global greenhouse gas emissions, making sustainable shipping practices not just an ethical choice but a necessary one for businesses committed to environmental responsibility.</p>

      <h3>The Business Case for Sustainable Shipping</h3>
      
      <p>Before diving into specific practices, it's worth noting that sustainable shipping isn't just good for the planet—it can be good for business too:</p>
      
      <ul>
        <li><strong>Consumer Demand:</strong> Today's consumers increasingly factor sustainability into their purchasing decisions, with many willing to pay more for eco-friendly options.</li>
        
        <li><strong>Brand Reputation:</strong> Demonstrating environmental responsibility can enhance brand image and build customer loyalty.</li>
        
        <li><strong>Cost Savings:</strong> Many sustainable practices, such as optimized routing and packaging reduction, can actually lower operational costs.</li>
        
        <li><strong>Regulatory Compliance:</strong> As environmental regulations tighten globally, adopting sustainable practices now can position businesses ahead of compliance requirements.</li>
      </ul>
      
      <h3>Sustainable Transportation Options</h3>
      
      <p>One of the most impactful ways businesses can reduce their shipping footprint is by choosing greener transportation methods:</p>
      
      <h4>1. Modal Shifts</h4>
      
      <p>Different transportation modes have vastly different environmental impacts. From most to least carbon-intensive (per ton-mile), the general hierarchy is:</p>
      
      <ul>
        <li><strong>Air Freight:</strong> The most carbon-intensive option, producing 20-30 times more emissions than ocean shipping.</li>
        
        <li><strong>Road Transport:</strong> Truck shipping has a significant but lower carbon footprint than air.</li>
        
        <li><strong>Rail Transport:</strong> Considerably more efficient than trucks, especially for long-distance transport.</li>
        
        <li><strong>Ocean Shipping:</strong> Despite recent scrutiny, still the most carbon-efficient way to move goods globally.</li>
      </ul>
      
      <p>Where feasible, shifting from air to ocean or from road to rail can dramatically reduce emissions. For example, moving from air freight to ocean shipping can reduce carbon emissions by up to 95% for the same shipment.</p>
      
      <h4>2. Alternative Fuels and Vehicle Technologies</h4>
      
      <p>Within each transportation mode, technological advances are creating greener options:</p>
      
      <ul>
        <li><strong>Electric Vehicles:</strong> For last-mile delivery and shorter routes, electric vehicles offer zero tailpipe emissions.</li>
        
        <li><strong>Hybrid Vehicles:</strong> A transitional option that can reduce fuel consumption by 15-30%.</li>
        
        <li><strong>Biofuels:</strong> Sustainably produced biofuels can reduce lifecycle carbon emissions compared to conventional fuels.</li>
        
        <li><strong>Hydrogen Fuel Cells:</strong> An emerging technology with potential for long-haul transport with zero emissions.</li>
        
        <li><strong>LNG (Liquefied Natural Gas):</strong> For ocean shipping, LNG offers reduced emissions compared to traditional bunker fuel.</li>
      </ul>
      
      <h3>Optimized Packaging Strategies</h3>
      
      <p>Packaging represents another significant opportunity for sustainability improvements:</p>
      
      <h4>1. Right-Sizing Packages</h4>
      
      <p>Oversized packages waste materials and space in transport vehicles, increasing both environmental impact and shipping costs. Implementing optimized, right-sized packaging can:</p>
      
      <ul>
        <li>Reduce material usage by up to 40%</li>
        <li>Increase transport efficiency by fitting more items per shipment</li>
        <li>Lower shipping costs by reducing dimensional weight charges</li>
      </ul>
      
      <h4>2. Sustainable Materials</h4>
      
      <p>The choice of packaging materials can significantly impact environmental footprint:</p>
      
      <ul>
        <li><strong>Recycled Content:</strong> Using recycled paper, cardboard, and plastics can reduce resource consumption and waste.</li>
        
        <li><strong>Biodegradable and Compostable Materials:</strong> Materials that break down naturally at end-of-life reduce landfill impact.</li>
        
        <li><strong>Plant-Based Plastics:</strong> Derived from renewable resources rather than petroleum, these can have a lower carbon footprint.</li>
        
        <li><strong>Reusable Packaging:</strong> For appropriate supply chains, durable, returnable packaging can dramatically reduce waste.</li>
      </ul>
      
      <h4>3. Minimalist Design</h4>
      
      <p>Beyond material choice, the design approach matters:</p>
      
      <ul>
        <li><strong>Reduced Layers:</strong> Eliminating unnecessary packaging layers and components.</li>
        
        <li><strong>Ink and Printing:</strong> Minimizing or using soy-based or water-based inks for necessary printing.</li>
        
        <li><strong>No Single-Use Plastics:</strong> Replacing plastic fillers, tape, and other disposable elements with sustainable alternatives.</li>
      </ul>
      
      <h3>Supply Chain Optimization</h3>
      
      <p>How goods move through the supply chain can be as important as the transportation methods used:</p>
      
      <h4>1. Route Optimization</h4>
      
      <p>Advanced logistics software can determine the most efficient delivery routes, reducing miles traveled, fuel consumed, and emissions produced. Studies show that optimized routing can reduce fuel consumption by 10-15% while improving delivery times.</p>
      
      <h4>2. Consolidation</h4>
      
      <p>Combining multiple shipments to utilize transport capacity more efficiently:</p>
      
      <ul>
        <li><strong>Less-than-Truckload (LTL) Consolidation:</strong> Combining smaller shipments to share truck space.</li>
        
        <li><strong>Cross-Docking:</strong> Transferring goods directly from inbound to outbound vehicles with minimal warehousing.</li>
        
        <li><strong>Order Batching:</strong> Grouping customer orders for more efficient fulfillment and delivery.</li>
      </ul>
      
      <h4>3. Localized Distribution</h4>
      
      <p>Strategically placing inventory closer to end customers can significantly reduce transportation distances and emissions:</p>
      
      <ul>
        <li><strong>Distributed Warehousing:</strong> Multiple smaller facilities located near major markets rather than centralized distribution.</li>
        
        <li><strong>Urban Micro-Fulfillment:</strong> Small-footprint facilities in urban areas enabling efficient last-mile delivery.</li>
      </ul>
      
      <h3>Measuring and Reporting</h3>
      
      <p>Effective sustainability initiatives require robust measurement and transparency:</p>
      
      <h4>1. Carbon Footprint Calculation</h4>
      
      <p>Implementing systems to accurately track emissions across the supply chain, often following standards such as the Greenhouse Gas Protocol. This can involve:</p>
      
      <ul>
        <li>Collecting data on transportation modes, distances, and loads</li>
        <li>Applying appropriate emissions factors</li>
        <li>Accounting for both direct and indirect emissions</li>
      </ul>
      
      <h4>2. Sustainability Reporting</h4>
      
      <p>Transparently communicating environmental performance to stakeholders through:</p>
      
      <ul>
        <li>Annual sustainability reports</li>
        <li>Carbon disclosure initiatives like CDP</li>
        <li>Product-level carbon footprint information</li>
      </ul>
      
      <h4>3. Setting Targets</h4>
      
      <p>Establishing clear, science-based targets for emissions reduction, with timelines and accountability mechanisms.</p>
      
      <h3>Collaborative Approaches</h3>
      
      <p>Sustainability in shipping often requires collaboration across the supply chain:</p>
      
      <h4>1. Carrier Partnerships</h4>
      
      <p>Working with transportation providers committed to sustainability, and potentially collaborating on green initiatives.</p>
      
      <h4>2. Industry Initiatives</h4>
      
      <p>Joining collaborative efforts like the Sustainable Freight Alliance or Clean Cargo Working Group to share best practices and drive industry-wide improvements.</p>
      
      <h4>3. Customer Education</h4>
      
      <p>Engaging customers in sustainability efforts by:</p>
      
      <ul>
        <li>Offering carbon-neutral shipping options</li>
        <li>Providing information about the environmental impact of different delivery choices</li>
        <li>Encouraging consolidated orders rather than multiple small shipments</li>
      </ul>
      
      <h3>Conclusion</h3>
      
      <p>Sustainable shipping is no longer merely a nice-to-have for eco-conscious businesses—it's becoming a competitive necessity and an ethical imperative. By thoughtfully implementing the practices outlined above, businesses can significantly reduce their environmental footprint while potentially improving operational efficiency and enhancing their brand reputation.</p>
      
      <p>At Dxpress Logistics, we're committed to partnering with businesses to develop and implement sustainable logistics solutions that align with both environmental goals and business objectives. Through innovative approaches and continuous improvement, we believe that the shipping industry can be transformed into a more sustainable sector that supports global commerce while protecting our planet.</p>`,
      tags: [
        "Sustainability",
        "Eco-Friendly",
        "Green Logistics",
        "Carbon Footprint",
        "Supply Chain",
      ],
      comments: [
        {
          id: 1,
          name: "Emma Rodriguez",
          email: "emma@example.com",
          date: "May 29, 2023",
          content:
            "This article provides excellent practical advice. We've recently switched to recycled packaging materials and our customers have responded very positively. The initial cost was higher but the brand value has been worth it.",
        },
        {
          id: 2,
          name: "Tomas Nguyen",
          email: "tomas@example.com",
          date: "May 30, 2023",
          content:
            "I appreciate the section on measuring carbon footprint. Do you have recommendations for specific software or tools that small businesses can use to start tracking their shipping emissions?",
        },
      ],
    },
    // Additional blog posts would be defined here
  };

  const post = posts[blogSlug];

  if (!post) {
    return res.status(404).render("404", {
      title: "Blog Post Not Found",
      path: "/blog",
    });
  }

  // Get related posts (in a real app, this would be more sophisticated)
  const relatedPosts = Object.values(posts)
    .filter((p) => p.slug !== blogSlug)
    .slice(0, 3);

  res.render("blog/details", {
    title: post.title,
    path: "/blog",
    post: post,
    relatedPosts: relatedPosts,
  });
};
