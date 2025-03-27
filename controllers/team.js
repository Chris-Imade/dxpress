exports.getTeamPage = (req, res) => {
  // Mock team data
  const teamMembers = [
    {
      id: "john-smith",
      name: "John Smith",
      position: "CEO & Founder",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80",
      socialLinks: {
        twitter: "https://twitter.com",
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
        linkedin: "https://linkedin.com",
      },
    },
    {
      id: "sarah-johnson",
      name: "Klaus Weber",
      position: "Operations Director",
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=988&q=80",
      socialLinks: {
        twitter: "https://twitter.com",
        facebook: "https://facebook.com",
        linkedin: "https://linkedin.com",
      },
    },
    {
      id: "michael-chen",
      name: "Michael Chen",
      position: "Logistics Manager",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      socialLinks: {
        twitter: "https://twitter.com",
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
      },
    },
    {
      id: "emily-patel",
      name: "Emily Patel",
      position: "Customer Relations",
      image:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1061&q=80",
      socialLinks: {
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
        linkedin: "https://linkedin.com",
      },
    },
    {
      id: "robert-williams",
      name: "Robert Williams",
      position: "Finance Director",
      image:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80",
      socialLinks: {
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
      },
    },
    {
      id: "sophia-rodriguez",
      name: "Sophia Rodriguez",
      position: "Marketing Head",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=988&q=80",
      socialLinks: {
        twitter: "https://twitter.com",
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
        linkedin: "https://linkedin.com",
      },
    },
    {
      id: "david-thompson",
      name: "David Thompson",
      position: "IT Director",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80",
      socialLinks: {
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
      },
    },
    {
      id: "olivia-white",
      name: "Olivia White",
      position: "HR Manager",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=964&q=80",
      socialLinks: {
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
        linkedin: "https://linkedin.com",
      },
    },
  ];

  res.render("team/index", {
    title: "Our Team",
    path: "/team",
    teamMembers: teamMembers,
  });
};

exports.getTeamDetailsPage = (req, res) => {
  const teamId = req.params.id;

  // Mock team member data - in a real app this would come from a database
  const teamMembers = {
    "john-smith": {
      id: "john-smith",
      name: "John Smith",
      position: "CEO & Founder",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80",
      bio: `John Smith is the visionary leader behind Dxpress Logistics. With over 20 years of experience in the logistics and transportation industry, John has built Dxpress from a small local operation into a global logistics provider serving clients in over 120 countries.
      
      Before founding Dxpress, John worked in senior positions at several multinational logistics companies, gaining invaluable experience in global supply chain management and international freight operations.
      
      Under his leadership, Dxpress has pioneered innovative logistics solutions, setting new standards for reliability, efficiency, and customer service in the industry.`,
      expertise: [
        "Global Logistics",
        "Supply Chain Management",
        "Business Strategy",
        "International Trade",
      ],
      education:
        "MBA from Harvard Business School, BS in Business Administration from University of Michigan",
      email: "",
      phone: "+44 7506 323071",
      socialLinks: {
        twitter: "https://twitter.com",
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
        linkedin: "https://linkedin.com",
      },
    },
    "klaus-weber": {
      id: "klaus-weber",
      name: "Klaus Weber",
      position: "Operations Director",
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=988&q=80",
      bio: `Klaus Weber oversees all operational aspects of Dxpress Logistics, ensuring seamless execution across our global network. With her strategic vision and operational expertise, Sarah has been instrumental in optimizing our processes and expanding our service capabilities.
      
      Sarah joined Dxpress in 2010 after a successful career at major logistics companies in Europe and Asia. Her international experience and deep understanding of complex supply chains have helped Dxpress develop tailored solutions for clients across industries.
      
      Under Sarah's leadership, our operations team has consistently delivered exceptional service quality while maintaining cost efficiency.`,
      expertise: [
        "Operations Management",
        "Process Optimization",
        "Warehouse Management",
        "Cross-Border Logistics",
      ],
      education:
        "MS in Supply Chain Management from MIT, BS in Logistics from University of Manchester",
      email: "",
      phone: "+44 7506 323072",
      socialLinks: {
        twitter: "https://twitter.com",
        facebook: "https://facebook.com",
        linkedin: "https://linkedin.com",
      },
    },
    // Additional team members would be defined here
  };

  const teamMember = teamMembers[teamId];

  if (!teamMember) {
    return res.status(404).render("404", {
      title: "Team Member Not Found",
      path: "/team",
    });
  }

  res.render("team/details", {
    title: teamMember.name,
    path: "/team",
    teamMember: teamMember,
  });
};
