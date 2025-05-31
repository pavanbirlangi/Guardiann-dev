-- Insert institutions
INSERT INTO institutions (
    id, category_id, name, slug, description, address, city, state,
    thumbnail_url, gallery, rating, contact, booking_amount, visiting_hours,
    type, starting_from, courses, infrastructure, fees
) VALUES
    -- Schools
    ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
    'Greenfield International School', 'greenfield-international-school',
    'Greenfield International School is a premier educational institution dedicated to nurturing global citizens through a holistic curriculum.',
    '123 Education Lane, Delhi', 'Delhi', 'Delhi',
    'https://images.unsplash.com/photo-1613896640137-bb5b31496315?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    '[
        "https://images.unsplash.com/photo-1613896640137-bb5b31496315?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    ]',
    4.7,
    '{
        "phone": "+91 98765 43210",
        "email": "info@greenfieldschool.edu",
        "website": "www.greenfieldschool.edu"
    }',
    2000.00,
    '[
        {"day": "Monday", "hours": "9:00 AM - 4:00 PM"},
        {"day": "Tuesday", "hours": "9:00 AM - 4:00 PM"},
        {"day": "Wednesday", "hours": "9:00 AM - 4:00 PM"},
        {"day": "Thursday", "hours": "9:00 AM - 4:00 PM"},
        {"day": "Friday", "hours": "9:00 AM - 4:00 PM"}
    ]',
    'International',
    80000.00,
    '[
        {
            "name": "Primary School",
            "description": "Our primary school program focuses on building strong foundations in core subjects while nurturing creativity and social skills.",
            "duration": "5 years"
        },
        {
            "name": "Middle School",
            "description": "The middle school program emphasizes academic excellence while developing critical thinking and leadership skills.",
            "duration": "3 years"
        },
        {
            "name": "High School",
            "description": "Our high school program prepares students for higher education with specialized streams in Science, Commerce, and Humanities.",
            "duration": "2 years"
        }
    ]',
    '[
        {
            "name": "Modern Classrooms",
            "description": "State-of-the-art classrooms equipped with smart boards and digital learning tools",
            "icon_url": "classroom-icon.png"
        },
        {
            "name": "Science Labs",
            "description": "Well-equipped laboratories for Physics, Chemistry, and Biology with modern equipment",
            "icon_url": "lab-icon.png"
        },
        {
            "name": "Sports Facilities",
            "description": "Extensive sports infrastructure including swimming pool, tennis courts, and athletic track",
            "icon_url": "sports-icon.png"
        }
    ]',
    '{
        "primary": {
            "amount": "₹80,000 - ₹1,00,000",
            "period": "per year",
            "includes": ["Books", "Uniform", "Sports Activities", "Basic Stationery"]
        },
        "middle": {
            "amount": "₹1,00,000 - ₹1,20,000",
            "period": "per year",
            "includes": ["Books", "Uniform", "Sports Activities", "Lab Equipment"]
        },
        "high": {
            "amount": "₹1,20,000 - ₹1,50,000",
            "period": "per year",
            "includes": ["Books", "Uniform", "Sports Activities", "Career Counseling"]
        }
    }'
    ),

    -- Colleges
    ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
    'National Institute of Technology', 'national-institute-of-technology',
    'The National Institute of Technology is a leading institution for engineering and technology education.',
    '101 College Road, Delhi', 'Delhi', 'Delhi',
    'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    '[
        "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1599687351724-dfa3c4ff81b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    ]',
    4.9,
    '{
        "phone": "+91 99887 76655",
        "email": "admissions@nit.edu",
        "website": "www.nit.edu"
    }',
    2000.00,
    '[
        {"day": "Monday", "hours": "9:00 AM - 5:00 PM"},
        {"day": "Tuesday", "hours": "9:00 AM - 5:00 PM"},
        {"day": "Wednesday", "hours": "9:00 AM - 5:00 PM"},
        {"day": "Thursday", "hours": "9:00 AM - 5:00 PM"},
        {"day": "Friday", "hours": "9:00 AM - 5:00 PM"}
    ]',
    'Engineering',
    125000.00,
    '[
        {
            "name": "Computer Science Engineering",
            "description": "A comprehensive program covering software development, algorithms, and computer systems.",
            "duration": "4 years"
        },
        {
            "name": "Electrical Engineering",
            "description": "Focuses on electrical systems, power electronics, and control systems.",
            "duration": "4 years"
        },
        {
            "name": "Mechanical Engineering",
            "description": "Covers mechanical systems, manufacturing processes, and thermal sciences.",
            "duration": "4 years"
        }
    ]',
    '[
        {
            "name": "Advanced Labs",
            "description": "Cutting-edge research laboratories with latest equipment and technology",
            "icon_url": "lab-icon.png"
        },
        {
            "name": "Research Centers",
            "description": "Dedicated research facilities for various engineering disciplines",
            "icon_url": "research-icon.png"
        },
        {
            "name": "Hostels",
            "description": "Modern residential facilities with 24/7 security and amenities",
            "icon_url": "hostel-icon.png"
        }
    ]',
    '{
        "btech": {
            "amount": "₹1,25,000 - ₹1,50,000",
            "period": "per year",
            "includes": ["Hostel", "Mess", "Lab Access", "Industry Projects"]
        },
        "mtech": {
            "amount": "₹1,50,000 - ₹1,80,000",
            "period": "per year",
            "includes": ["Hostel", "Mess", "Lab Access", "Industry Projects"]
        },
        "phd": {
            "amount": "₹80,000 - ₹1,00,000",
            "period": "per year",
            "includes": ["Hostel", "Mess", "Lab Access", "Research Funding"]
        }
    }'
    ),

    -- Coaching Centers
    ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
    'Brilliant Tutorials', 'brilliant-tutorials',
    'Brilliant Tutorials is a leading coaching center specializing in competitive exam preparation.',
    '303 Coaching Street, Delhi', 'Delhi', 'Delhi',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    '[
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1522881193457-37ae97c905bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    ]',
    4.5,
    '{
        "phone": "+91 98123 45678",
        "email": "contact@brillianttutorials.com",
        "website": "www.brillianttutorials.com"
    }',
    2000.00,
    '[
        {"day": "Monday", "hours": "8:00 AM - 8:00 PM"},
        {"day": "Tuesday", "hours": "8:00 AM - 8:00 PM"},
        {"day": "Wednesday", "hours": "8:00 AM - 8:00 PM"},
        {"day": "Thursday", "hours": "8:00 AM - 8:00 PM"},
        {"day": "Friday", "hours": "8:00 AM - 8:00 PM"},
        {"day": "Saturday", "hours": "8:00 AM - 2:00 PM"}
    ]',
    'JEE/NEET',
    45000.00,
    '[
        {
            "name": "JEE Main & Advanced",
            "description": "Comprehensive preparation for engineering entrance exams with focus on Physics, Chemistry, and Mathematics.",
            "duration": "2 years"
        },
        {
            "name": "NEET",
            "description": "Specialized coaching for medical entrance exam with emphasis on Biology, Physics, and Chemistry.",
            "duration": "2 years"
        },
        {
            "name": "Foundation Courses",
            "description": "Early preparation program for students in classes 9-10, building strong fundamentals in core subjects.",
            "duration": "2 years"
        }
    ]',
    '[
        {
            "name": "Smart Classrooms",
            "description": "Technology-enabled learning spaces with audio-visual equipment",
            "icon_url": "classroom-icon.png"
        },
        {
            "name": "Library",
            "description": "Comprehensive collection of study materials and digital resources",
            "icon_url": "library-icon.png"
        },
        {
            "name": "Practice Test Center",
            "description": "Dedicated facilities for mock tests and practice sessions",
            "icon_url": "test-icon.png"
        }
    ]',
    '{
        "jee": {
            "amount": "₹85,000 - ₹1,20,000",
            "period": "per year",
            "includes": ["Study Material", "Mock Tests", "Doubt Sessions", "Online Resources"]
        },
        "neet": {
            "amount": "₹90,000 - ₹1,30,000",
            "period": "per year",
            "includes": ["Study Material", "Mock Tests", "Doubt Sessions", "Online Resources"]
        },
        "foundation": {
            "amount": "₹45,000 - ₹60,000",
            "period": "per year",
            "includes": ["Study Material", "Basic Tests", "Doubt Sessions"]
        }
    }'
    ),

    -- PG Colleges
    ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
    'Indian Institute of Management', 'indian-institute-of-management',
    'The Indian Institute of Management is a world-renowned institution for management education.',
    '505 MBA Road, Bangalore', 'Bangalore', 'Karnataka',
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    '[
        "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    ]',
    4.9,
    '{
        "phone": "+91 80123 45678",
        "email": "admissions@iim.ac.in",
        "website": "www.iim.ac.in"
    }',
    2000.00,
    '[
        {"day": "Monday", "hours": "9:00 AM - 5:00 PM"},
        {"day": "Tuesday", "hours": "9:00 AM - 5:00 PM"},
        {"day": "Wednesday", "hours": "9:00 AM - 5:00 PM"},
        {"day": "Thursday", "hours": "9:00 AM - 5:00 PM"},
        {"day": "Friday", "hours": "9:00 AM - 5:00 PM"}
    ]',
    'MBA',
    2300000.00,
    '[
        {
            "name": "MBA",
            "description": "A comprehensive management program covering all aspects of business administration.",
            "duration": "2 years"
        },
        {
            "name": "Executive MBA",
            "description": "Designed for working professionals, this program offers flexible scheduling and industry-relevant curriculum.",
            "duration": "2 years"
        },
        {
            "name": "PhD in Management",
            "description": "Research-focused program for aspiring academics and industry researchers.",
            "duration": "4 years"
        }
    ]',
    '[
        {
            "name": "Smart Classrooms",
            "description": "Advanced learning environments with cutting-edge technology",
            "icon_url": "classroom-icon.png"
        },
        {
            "name": "Research Centers",
            "description": "State-of-the-art facilities for management research",
            "icon_url": "research-icon.png"
        },
        {
            "name": "Conference Halls",
            "description": "Modern conference facilities for seminars and corporate events",
            "icon_url": "conference-icon.png"
        }
    ]',
    '{
        "mba": {
            "amount": "₹23,00,000",
            "period": "total",
            "includes": ["Hostel", "Study Material", "International Exchange", "Placement Support"]
        },
        "emba": {
            "amount": "₹27,00,000",
            "period": "total",
            "includes": ["Study Material", "Leadership Programs", "Networking Events", "Placement Support"]
        },
        "phd": {
            "amount": "₹5,00,000",
            "period": "per year",
            "includes": ["Research Funding", "Publication Support", "Conference Travel", "Stipend"]
        }
    }'
    )
ON CONFLICT (slug) DO NOTHING;

-- Insert sample bookings
INSERT INTO bookings (
    id, booking_id, user_id, institution_id, status, booking_date, 
    visit_date, visit_time, amount, payment_id, notes
) VALUES
    ('11111111-1111-1111-1111-111111111111', 'BK202403150001', 
    '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
    'confirmed', CURRENT_TIMESTAMP, '2024-03-20', '10:00:00', 2000.00,
    'PAY123456789', 'School visit for admission inquiry'),
    
    ('22222222-2222-2222-2222-222222222222', 'BK202403150002',
    '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
    'pending', CURRENT_TIMESTAMP, '2024-03-21', '11:00:00', 2000.00,
    NULL, 'College campus tour'),
    
    ('33333333-3333-3333-3333-333333333333', 'BK202403150003',
    '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333',
    'completed', CURRENT_TIMESTAMP, '2024-03-19', '14:00:00', 2000.00,
    'PAY987654321', 'Coaching center visit'),
    
    ('44444444-4444-4444-4444-444444444444', 'BK202403150004',
    '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444',
    'confirmed', CURRENT_TIMESTAMP, '2024-03-22', '15:00:00', 2000.00,
    'PAY456789123', 'MBA program inquiry')
ON CONFLICT (booking_id) DO NOTHING; 