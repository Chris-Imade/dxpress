exports.getProjectsPage = (req, res) => {
  // Mock projects data - in a real app, this would come from a database
  const projects = [
    {
      id: "global-supply-chain-optimization",
      title: "Global Supply Chain Optimization",
      category: "Supply Chain",
      client: "TechGiant Inc.",
      date: "June 2023",
      image:
        "https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      shortDescription:
        "Redesigned the global supply chain network for a leading technology company, resulting in 30% cost reduction and 40% faster delivery times.",
    },
    {
      id: "warehouse-automation-system",
      title: "Warehouse Automation System",
      category: "Warehouse",
      client: "Global Retail Solutions",
      date: "April 2023",
      image:
        "https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      shortDescription:
        "Implemented a fully automated warehouse management system with robotic picking and sorting, increasing efficiency by 65%.",
    },
    {
      id: "cross-border-logistics-solution",
      title: "Cross-Border Logistics Solution",
      category: "International",
      client: "Fashion Retailer",
      date: "March 2023",
      image:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      shortDescription:
        "Developed a comprehensive cross-border logistics solution for a fast-fashion retailer, enabling expansion into 15 new markets.",
    },
    {
      id: "sustainable-packaging-initiative",
      title: "Sustainable Packaging Initiative",
      category: "Sustainability",
      client: "Eco Brands Corp",
      date: "February 2023",
      image:
        "https://images.unsplash.com/photo-1607655481512-94487af0357f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      shortDescription:
        "Implemented eco-friendly packaging solutions across the supply chain, reducing carbon footprint by 45% and packaging costs by 20%.",
    },
    {
      id: "cold-chain-logistics-network",
      title: "Cold Chain Logistics Network",
      category: "Healthcare",
      client: "Pharma International",
      date: "January 2023",
      image:
        "https://images.unsplash.com/photo-1504376379689-8d54347b26c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80",
      shortDescription:
        "Designed and implemented a temperature-controlled logistics network for pharmaceutical distribution across 25 countries.",
    },
    {
      id: "last-mile-delivery-optimization",
      title: "Last-Mile Delivery Optimization",
      category: "Delivery",
      client: "E-commerce Platform",
      date: "December 2022",
      image:
        "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      shortDescription:
        "Optimized last-mile delivery operations for a major e-commerce platform, reducing delivery times by 35% and costs by 25%.",
    },
  ];

  res.render("project/index", {
    title: "Our Projects",
    path: "/project",
    projects: projects,
  });
};

exports.getProjectDetailsPage = (req, res) => {
  const projectId = req.params.id;

  // Mock project data - in a real app, this would come from a database
  const projects = {
    "global-supply-chain-optimization": {
      id: "global-supply-chain-optimization",
      title: "Global Supply Chain Optimization",
      category: "Supply Chain",
      client: "TechGiant Inc.",
      location: "Multiple Global Locations",
      date: "June 2023",
      image:
        "https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1578575437130-527eed3abbec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
      ],
      description: `<p>Dxpress Logistics was engaged by TechGiant Inc., a leading global technology company, to redesign their entire supply chain network to improve efficiency, reduce costs, and enhance delivery speed across their global operations.</p>
      
      <p>The client was facing challenges with their existing supply chain infrastructure, which had grown organically over years of rapid expansion. This resulted in redundancies, inefficiencies, and high operational costs. They needed a comprehensive solution to optimize their supply chain while maintaining service quality.</p>
      
      <p>Our team conducted an extensive analysis of the client's existing supply chain network, including warehousing facilities, transportation routes, inventory management systems, and supplier relationships. Based on this analysis, we developed a complete redesign of their global supply chain infrastructure.</p>`,
      challenge: `<p>The main challenges in this project included:</p>
      <ul>
        <li>Analyzing and redesigning a complex network spanning 45 countries</li>
        <li>Ensuring business continuity during the transition</li>
        <li>Integrating diverse regional operations into a cohesive global system</li>
        <li>Balancing cost reduction with service level improvements</li>
        <li>Managing the change process across multiple stakeholders</li>
      </ul>`,
      solution: `<p>Our solution included the following key components:</p>
      <ul>
        <li>Consolidated 35 regional warehouses into 15 strategic distribution centers</li>
        <li>Implemented advanced inventory management systems using AI for demand forecasting</li>
        <li>Redesigned transportation networks and carrier selection processes</li>
        <li>Developed a centralized control tower for end-to-end supply chain visibility</li>
        <li>Created standardized processes across all global operations</li>
        <li>Integrated sustainability practices into the supply chain design</li>
      </ul>`,
      results: `<p>The project delivered significant improvements across multiple metrics:</p>
      <ul>
        <li>30% reduction in overall supply chain costs</li>
        <li>40% improvement in average delivery times</li>
        <li>25% reduction in inventory carrying costs</li>
        <li>60% increase in supply chain visibility</li>
        <li>35% reduction in carbon emissions from logistics operations</li>
        <li>Enabled expansion into 10 new markets with minimal additional infrastructure</li>
      </ul>`,
    },
    "warehouse-automation-system": {
      id: "warehouse-automation-system",
      title: "Warehouse Automation System",
      category: "Warehouse",
      client: "Global Retail Solutions",
      location: "London, UK",
      date: "April 2023",
      image:
        "https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1578575437130-527eed3abbec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
      ],
      description: `<p>Global Retail Solutions, a major retail distribution company, approached Dxpress Logistics to design and implement a fully automated warehouse management system to increase efficiency and throughput at their main distribution center in London.</p>
      
      <p>The client was experiencing significant growth in order volumes but was constrained by the limitations of their traditional warehouse operations. They needed a solution that would dramatically increase their capacity and efficiency without expanding their physical footprint.</p>
      
      <p>Our team designed a comprehensive warehouse automation solution incorporating state-of-the-art robotics, AI-driven inventory management, and advanced sorting systems. The project involved a complete redesign of the warehouse layout, installation of new technologies, and implementation of supporting software systems.</p>`,
      challenge: `<p>Key challenges in this project included:</p>
      <ul>
        <li>Integrating multiple automation technologies into a cohesive system</li>
        <li>Implementing the solution with minimal disruption to ongoing operations</li>
        <li>Training staff to work effectively with the new automated systems</li>
        <li>Ensuring flexibility to handle seasonal peaks in demand</li>
        <li>Maintaining accuracy and quality while increasing processing speed</li>
      </ul>`,
      solution: `<p>Our comprehensive solution included:</p>
      <ul>
        <li>Autonomous mobile robots (AMRs) for inventory movement</li>
        <li>AI-powered picking systems with collaborative robots</li>
        <li>High-speed automated sorting and packaging lines</li>
        <li>Advanced warehouse execution system (WES) software</li>
        <li>Real-time inventory management and tracking</li>
        <li>Modular design allowing for future expansion and technology updates</li>
      </ul>`,
      results: `<p>The implementation delivered exceptional results:</p>
      <ul>
        <li>65% increase in overall warehouse efficiency</li>
        <li>85% reduction in order fulfillment time</li>
        <li>99.9% order accuracy, up from 96%</li>
        <li>70% reduction in labor costs for order processing</li>
        <li>200% increase in throughput capacity during peak periods</li>
        <li>50% reduction in energy consumption per order processed</li>
      </ul>`,
    },
    // Additional projects would be defined here
  };

  const project = projects[projectId];

  if (!project) {
    return res.status(404).render("404", {
      title: "Project Not Found",
      path: "/project",
    });
  }

  // Get related projects (in a real app, this would be more sophisticated)
  const relatedProjects = Object.values(projects)
    .filter((p) => p.id !== projectId)
    .slice(0, 3);

  res.render("project/details", {
    title: project.title,
    path: "/project",
    project: project,
    relatedProjects: relatedProjects,
  });
};
