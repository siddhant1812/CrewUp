// Project types contractors post; trade categories subcontractors post.
const CONTRACTOR_CATEGORIES = {
  "Residential Construction": [
    "Apartment building construction",
    "Single-family home construction",
    "Townhouse construction",
    "Luxury villa construction",
    "Housing society construction",
    "Residential building renovation"
  ],
  "Commercial Construction": [
    "Office building construction",
    "Shopping mall construction",
    "Hotel construction",
    "Restaurant construction",
    "Retail store construction",
    "Commercial complex construction"
  ],
  "Industrial Construction": [
    "Factory construction",
    "Warehouse construction",
    "Manufacturing plant construction",
    "Distribution center construction",
    "Industrial facility renovation"
  ],
  "Infrastructure Construction": [
    "Road and highway construction",
    "Bridge construction",
    "Parking garage construction",
    "Drainage system construction",
    "Water supply infrastructure"
  ],
  "Renovation and Remodeling": [
    "Whole-house renovation",
    "Office remodeling",
    "Apartment renovation",
    "Kitchen and bathroom remodeling",
    "Building extensions and additions"
  ]
};

const SUBCONTRACTOR_CATEGORIES = {
  "Electrical": [
    "Residential electrician",
    "Commercial electrician",
    "Electrical wiring and installation",
    "Lighting installation",
    "Electrical panel installation",
    "Fire alarm system installation"
  ],
  "Plumbing": [
    "Residential plumber",
    "Commercial plumbing",
    "Water pipe installation",
    "Drainage and sewer installation",
    "Bathroom fixture installation",
    "Water heater installation"
  ],
  "Painting and Finishing": [
    "Interior painting",
    "Exterior painting",
    "Spray painting",
    "Wallpaper installation",
    "Drywall finishing",
    "Decorative wall finishing"
  ],
  "Concrete and Foundation": [
    "Concrete pouring",
    "Foundation work",
    "Concrete slab installation",
    "Concrete repair",
    "Formwork and shuttering",
    "Concrete finishing"
  ],
  "Masonry and Brickwork": [
    "Bricklaying",
    "Blockwork",
    "Stone masonry",
    "Retaining wall construction",
    "Chimney masonry"
  ],
  "HVAC": [
    "Air conditioning installation",
    "Heating system installation",
    "Ventilation system installation",
    "Commercial ductwork",
    "HVAC maintenance"
  ],
  "Roofing and Waterproofing": [
    "Residential roof installation",
    "Commercial roofing",
    "Roof repair",
    "Basement waterproofing",
    "Terrace waterproofing",
    "Gutter installation"
  ],
  "Flooring and Tiling": [
    "Ceramic tile installation",
    "Marble and granite installation",
    "Hardwood flooring",
    "Vinyl flooring",
    "Carpet installation",
    "Floor polishing"
  ],
  "Steel and Metalwork": [
    "Structural steel installation",
    "Metal fabrication",
    "Welding",
    "Staircase fabrication",
    "Metal railing installation",
    "Steel beam installation"
  ],
  "Carpentry": [
    "Door and window installation",
    "Cabinet installation",
    "Custom furniture",
    "Framing and woodwork",
    "Trim and molding installation",
    "Deck construction"
  ],
  "Excavation and Site Preparation": [
    "Land clearing",
    "Foundation excavation",
    "Grading and leveling",
    "Trenching",
    "Demolition",
    "Soil compaction"
  ],
  "Glass, Windows and Facades": [
    "Window installation",
    "Glass door installation",
    "Curtain wall installation",
    "Storefront glass installation",
    "Glass partition installation"
  ],
  "Insulation": [
    "Thermal insulation",
    "Sound insulation"
  ],
  "Drywall": [
    "Partition walls",
    "Ceiling installation"
  ],
  "Landscaping": [
    "Lawn installation",
    "Planting",
    "Irrigation"
  ],
  "Fencing": [
    "Wood fencing",
    "Metal fencing",
    "Security fencing"
  ],
  "Fire protection": [
    "Sprinkler systems",
    "Fire suppression systems"
  ],
  "Elevators": [
    "Elevator installation",
    "Lift installation"
  ],
  "Solar": [
    "Solar panel installation"
  ],
  "Paving": [
    "Driveways",
    "Sidewalks",
    "Parking lots"
  ],
  "Cleaning": [
    "Post-construction cleaning",
    "Site cleanup"
  ],
  "Heavy equipment": [
    "Crane operator",
    "Excavator operator",
    "Bulldozer operator"
  ]
};

function categoriesFor(contractorType) {
  return contractorType === "general_contractor"
    ? CONTRACTOR_CATEGORIES
    : SUBCONTRACTOR_CATEGORIES;
}

function posterRole(contractorType) {
  return contractorType === "general_contractor" ? "contractor" : "subcontractor";
}

// Returns an error message, or "" when the pair is valid for this poster.
function validateCategory(contractorType, category, service) {
  const map = categoriesFor(contractorType);
  if (!category || !map[category]) {
    return contractorType === "general_contractor"
      ? "Choose a valid project type."
      : "Choose a valid trade category.";
  }
  if (service && !map[category].includes(service)) {
    return "Choose a service that belongs to the selected category.";
  }
  return "";
}

module.exports = {
  CONTRACTOR_CATEGORIES,
  SUBCONTRACTOR_CATEGORIES,
  categoriesFor,
  posterRole,
  validateCategory,
};
