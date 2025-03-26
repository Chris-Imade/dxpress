exports.getServicesPage = (req, res) => {
  // Mock services data - in a real app, this would come from a database
  const services = [
    {
      id: "air-freight",
      title: "Air Freight",
      image:
        "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=600&auto=format&fit=crop",
      shortDescription:
        "Fast and reliable air freight services for time-sensitive cargo worldwide.",
    },
    {
      id: "ocean-freight",
      title: "Ocean Freight",
      image:
        "https://images.unsplash.com/photo-1494412519320-aa613dfb7738?w=600&auto=format&fit=crop",
      shortDescription:
        "Cost-effective ocean freight solutions for large shipments and global trade.",
    },
    {
      id: "road-transport",
      title: "Road Transport",
      image:
        "https://images.unsplash.com/photo-1586482731252-7c133ca8e81e?w=600&auto=format&fit=crop",
      shortDescription:
        "Efficient road transportation services with extensive coverage across continents.",
    },
    {
      id: "rail-freight",
      title: "Rail Freight",
      image:
        "https://images.unsplash.com/photo-1563203278-8114e6b47522?w=600&auto=format&fit=crop",
      shortDescription:
        "Eco-friendly rail freight options for long-distance land transportation.",
    },
    {
      id: "warehousing",
      title: "Warehousing",
      image:
        "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&auto=format&fit=crop",
      shortDescription:
        "Secure warehousing and distribution facilities to support your supply chain.",
    },
    {
      id: "customs-clearance",
      title: "Customs Clearance",
      image:
        "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop",
      shortDescription:
        "Expert customs clearance services to ensure smooth international shipping.",
    },
  ];

  res.render("service/index", {
    title: "Our Services",
    path: "/services",
    services: services,
  });
};

exports.getServiceDetailsPage = (req, res) => {
  const serviceId = req.params.id;

  // Mock services data - in a real app, this would come from a database
  const services = {
    "air-freight": {
      id: "air-freight",
      title: "Air Freight",
      image:
        "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=600&auto=format&fit=crop",
      banner:
        "https://images.unsplash.com/photo-1610642434333-6561ca8acee4?w=1200&auto=format&fit=crop",
      description:
        "<p>Our air freight services provide fast and reliable transportation for time-sensitive cargo. With our extensive network of airline partners, we offer comprehensive solutions for shipping by air to destinations worldwide.</p><p>Whether you need to ship documents, perishable goods, high-value items, or oversized cargo, our dedicated team ensures your shipment reaches its destination safely and on time.</p>",
      benefits: [
        "Fastest transportation method for international shipments",
        "Ideal for high-value, time-sensitive, or perishable goods",
        "Reduced warehousing needs due to shorter transit times",
        "Enhanced security with advanced tracking systems",
        "Flexible scheduling with multiple flight options daily",
        "Simplified customs clearance with our expert team",
      ],
      features: [
        {
          title: "Global Network",
          description: "Access to major airlines and airports worldwide",
          icon: "/assets/images/icons/service-icon1.svg",
        },
        {
          title: "Time-Definite Delivery",
          description: "Guaranteed delivery times to meet your deadlines",
          icon: "/assets/images/icons/service-icon2.svg",
        },
        {
          title: "Specialized Handling",
          description:
            "Solutions for temperature-sensitive and hazardous goods",
          icon: "/assets/images/icons/service-icon3.svg",
        },
        {
          title: "Real-Time Tracking",
          description:
            "Monitor your shipment's progress throughout its journey",
          icon: "/assets/images/icons/service-icon4.svg",
        },
      ],
      process: [
        {
          step: "Booking",
          description: "Schedule your shipment with detailed cargo information",
        },
        {
          step: "Collection",
          description: "We pick up your cargo from your location",
        },
        {
          step: "Documentation",
          description:
            "We handle all necessary paperwork and customs requirements",
        },
        {
          step: "Transportation",
          description:
            "Your cargo is loaded onto the aircraft and flown to destination",
        },
        {
          step: "Customs Clearance",
          description: "We clear your shipment through customs at destination",
        },
        {
          step: "Delivery",
          description: "Your cargo is delivered to the final destination",
        },
      ],
    },
    "ocean-freight": {
      id: "ocean-freight",
      title: "Ocean Freight",
      image:
        "https://images.unsplash.com/photo-1494412519320-aa613dfb7738?w=600&auto=format&fit=crop",
      banner:
        "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1200&auto=format&fit=crop",
      description:
        "<p>Our ocean freight services offer cost-effective solutions for shipping large volumes of goods internationally. We provide both Full Container Load (FCL) and Less than Container Load (LCL) options to meet your specific needs.</p><p>With strategic partnerships with major shipping lines, we ensure competitive rates, reliable schedules, and comprehensive end-to-end service for your maritime shipping requirements.</p>",
      benefits: [
        "Cost-effective for large shipments compared to other transportation modes",
        "Environmentally friendly with lower carbon footprint per unit",
        "Suitable for all types of cargo, including oversized and heavy items",
        "Flexible shipping options with FCL and LCL services",
        "Global coverage with access to all major ports worldwide",
        "Comprehensive insurance coverage options",
      ],
      features: [
        {
          title: "FCL & LCL Services",
          description:
            "Options for both full container and shared container shipping",
          icon: "/assets/images/icons/service-icon1.svg",
        },
        {
          title: "Special Equipment",
          description:
            "Access to refrigerated, open-top, and flat-rack containers",
          icon: "/assets/images/icons/service-icon2.svg",
        },
        {
          title: "Port-to-Port or Door-to-Door",
          description:
            "Flexible service options to match your supply chain needs",
          icon: "/assets/images/icons/service-icon3.svg",
        },
        {
          title: "Customs Brokerage",
          description:
            "Integrated customs clearance services at origin and destination",
          icon: "/assets/images/icons/service-icon4.svg",
        },
      ],
      process: [
        {
          step: "Booking",
          description:
            "Reserve space on a vessel based on your cargo and schedule requirements",
        },
        {
          step: "Container Stuffing",
          description: "Your cargo is loaded into containers at origin",
        },
        {
          step: "Documentation",
          description: "We prepare and process all required shipping documents",
        },
        {
          step: "Ocean Transit",
          description:
            "Your cargo is transported by sea to the destination port",
        },
        {
          step: "Customs Clearance",
          description: "We clear your shipment through customs at destination",
        },
        {
          step: "Final Delivery",
          description: "Your cargo is delivered to the designated location",
        },
      ],
    },
    "road-transport": {
      id: "road-transport",
      title: "Road Transport",
      image:
        "https://images.unsplash.com/photo-1586482731252-7c133ca8e81e?w=600&auto=format&fit=crop",
      banner:
        "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?w=1200&auto=format&fit=crop",
      description:
        "<p>Our road transport services offer flexible and efficient solutions for domestic and cross-border shipping. With our extensive fleet of vehicles and network of carriers, we provide reliable ground transportation for all types of cargo.</p><p>Whether you need full truckload (FTL), less than truckload (LTL), or specialized equipment, our road transport solutions are designed to meet your specific requirements.</p>",
      benefits: [
        "Door-to-door delivery service for maximum convenience",
        "Flexible scheduling with multiple departure options",
        "Cost-effective solution for short to medium distance shipments",
        "Transparent tracking and delivery confirmation",
        "Wide range of vehicle types to accommodate different cargo needs",
        "Expedited and time-definite delivery options available",
      ],
      features: [
        {
          title: "Extensive Network",
          description: "Coverage across major highways and trade routes",
          icon: "/assets/images/icons/service-icon1.svg",
        },
        {
          title: "Diverse Fleet",
          description: "From vans to multi-axle trucks for any shipment size",
          icon: "/assets/images/icons/service-icon2.svg",
        },
        {
          title: "Express Delivery",
          description: "Dedicated vehicles for time-critical shipments",
          icon: "/assets/images/icons/service-icon3.svg",
        },
        {
          title: "Advanced Technology",
          description: "GPS tracking and electronic proof of delivery",
          icon: "/assets/images/icons/service-icon4.svg",
        },
      ],
      process: [
        {
          step: "Request Quote",
          description: "Share your shipment details for accurate pricing",
        },
        {
          step: "Booking",
          description: "Schedule your pickup with convenient time slots",
        },
        {
          step: "Collection",
          description: "Our driver collects your cargo from your location",
        },
        {
          step: "Transportation",
          description: "Your cargo is transported via optimized routes",
        },
        {
          step: "Delivery",
          description: "On-time delivery to the designated location",
        },
        {
          step: "Confirmation",
          description: "Electronic confirmation of delivery completion",
        },
      ],
    },
    "rail-freight": {
      id: "rail-freight",
      title: "Rail Freight",
      image:
        "https://images.unsplash.com/photo-1563203278-8114e6b47522?w=600&auto=format&fit=crop",
      banner:
        "https://images.unsplash.com/photo-1635359858361-7600c4db589a?w=1200&auto=format&fit=crop",
      description:
        "<p>Our rail freight services provide a cost-effective and environmentally friendly solution for shipping large volumes over long distances. With connections to major rail networks, we offer reliable and sustainable transportation options.</p><p>Rail freight is ideal for high-volume, bulky, or heavy cargo that needs to be transported over long distances, offering significant cost savings compared to road or air transport.</p>",
      benefits: [
        "Lower carbon footprint compared to road or air transport",
        "Cost-effective for long-distance, high-volume shipments",
        "Reliable schedules with minimal disruption from weather conditions",
        "Reduced risk of delays from traffic congestion",
        "Secure transportation with reduced handling and damage risk",
        "Suitable for containers, bulk commodities, and oversized cargo",
      ],
      features: [
        {
          title: "Intermodal Solutions",
          description: "Seamless connections with road and ocean transport",
          icon: "/assets/images/icons/service-icon1.svg",
        },
        {
          title: "Bulk Transport",
          description: "Specialized equipment for bulk commodities",
          icon: "/assets/images/icons/service-icon2.svg",
        },
        {
          title: "Container Service",
          description: "Efficient movement of standard and special containers",
          icon: "/assets/images/icons/service-icon3.svg",
        },
        {
          title: "Block Trains",
          description: "Dedicated trains for high-volume, regular shipments",
          icon: "/assets/images/icons/service-icon4.svg",
        },
      ],
      process: [
        {
          step: "Consultation",
          description: "Determine if rail freight is suitable for your cargo",
        },
        {
          step: "Planning",
          description: "Schedule and route optimization for your shipment",
        },
        {
          step: "Collection",
          description: "Pickup of cargo and transport to rail terminal",
        },
        {
          step: "Loading",
          description: "Secure loading onto rail cars or containers",
        },
        {
          step: "Transport",
          description: "Rail transportation to destination terminal",
        },
        {
          step: "Delivery",
          description: "Final delivery from terminal to destination",
        },
      ],
    },
    warehousing: {
      id: "warehousing",
      title: "Warehousing",
      image:
        "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&auto=format&fit=crop",
      banner:
        "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&auto=format&fit=crop",
      description:
        "<p>Our warehousing solutions provide secure storage and efficient inventory management for your products. With strategically located facilities, we offer flexible space to support your supply chain operations.</p><p>From short-term storage to long-term distribution, our warehousing services include receiving, storage, inventory management, order fulfillment, and distribution to help streamline your logistics processes.</p>",
      benefits: [
        "Strategic locations near major transportation hubs",
        "Flexible storage options to match your changing needs",
        "Reduced operating costs through shared facilities",
        "Enhanced inventory control and visibility",
        "Value-added services to streamline your supply chain",
        "Scalable solutions to support business growth",
      ],
      features: [
        {
          title: "Modern Facilities",
          description: "Climate-controlled and secure storage areas",
          icon: "/assets/images/icons/service-icon1.svg",
        },
        {
          title: "Inventory Management",
          description: "Real-time tracking and inventory control systems",
          icon: "/assets/images/icons/service-icon2.svg",
        },
        {
          title: "Order Fulfillment",
          description: "Picking, packing, and shipping services",
          icon: "/assets/images/icons/service-icon3.svg",
        },
        {
          title: "Value-Added Services",
          description: "Labeling, kitting, and quality control",
          icon: "/assets/images/icons/service-icon4.svg",
        },
      ],
      process: [
        {
          step: "Receiving",
          description: "Unloading and inspection of incoming goods",
        },
        {
          step: "Storage",
          description: "Placement in appropriate storage locations",
        },
        {
          step: "Inventory Management",
          description: "Tracking and managing your stock levels",
        },
        {
          step: "Order Processing",
          description: "Receiving and processing customer orders",
        },
        {
          step: "Picking & Packing",
          description: "Preparing orders for shipment",
        },
        {
          step: "Shipping",
          description: "Dispatch to final destinations via preferred carriers",
        },
      ],
    },
    "customs-clearance": {
      id: "customs-clearance",
      title: "Customs Clearance",
      image:
        "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop",
      banner:
        "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&auto=format&fit=crop",
      description:
        "<p>Our customs clearance services ensure smooth and compliant movement of your goods across international borders. With our expertise in customs regulations and documentation, we help you navigate complex customs procedures with ease.</p><p>Our customs specialists handle all necessary documentation, duties and taxes, ensuring your shipments comply with local laws and regulations, preventing delays and penalties.</p>",
      benefits: [
        "Expert guidance through complex customs regulations",
        "Reduced risk of delays and penalties",
        "Complete documentation preparation and submission",
        "Duty and tax calculation and payment management",
        "Trade compliance advice and consulting",
        "Electronic customs filing for faster clearance",
      ],
      features: [
        {
          title: "Global Expertise",
          description: "Knowledge of customs requirements worldwide",
          icon: "/assets/images/icons/service-icon1.svg",
        },
        {
          title: "Documentation Services",
          description: "Preparation and verification of all required documents",
          icon: "/assets/images/icons/service-icon2.svg",
        },
        {
          title: "Duty & Tax Management",
          description: "Calculation and payment of all applicable fees",
          icon: "/assets/images/icons/service-icon3.svg",
        },
        {
          title: "Compliance Solutions",
          description: "Ensuring adherence to all trade regulations",
          icon: "/assets/images/icons/service-icon4.svg",
        },
      ],
      process: [
        {
          step: "Pre-Clearance Review",
          description:
            "Assessment of your shipment's documentation requirements",
        },
        {
          step: "Document Preparation",
          description:
            "Creation and compilation of necessary customs documents",
        },
        {
          step: "Classification & Valuation",
          description: "Determining the correct tariff codes and values",
        },
        {
          step: "Filing",
          description: "Submission of documents to customs authorities",
        },
        {
          step: "Payment",
          description: "Handling of duties, taxes, and other fees",
        },
        {
          step: "Release",
          description: "Securing release of your goods from customs control",
        },
      ],
    },
  };

  const service = services[serviceId];

  if (!service) {
    return res.status(404).render("404", {
      title: "Service Not Found",
      path: "/services",
    });
  }

  // Get related services (in a real app, this would be more sophisticated)
  const relatedServices = Object.values(services)
    .filter((s) => s.id !== serviceId)
    .slice(0, 3);

  res.render("service/details", {
    title: service.title,
    path: "/services",
    service: service,
    relatedServices: relatedServices,
  });
};
