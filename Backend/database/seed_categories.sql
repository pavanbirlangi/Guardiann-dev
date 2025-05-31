-- Insert categories with their subcategories
INSERT INTO categories (name, slug, description, subcategories, display_order) VALUES
(
    'Schools',
    'schools',
    'Find the best K-12 schools in your area, from primary to senior secondary education. Compare facilities, curriculum, and more to make the best choice for your child.',
    ARRAY['Primary Schools', 'Secondary Schools', 'International Schools', 'Boarding Schools'],
    1
),
(
    'Colleges',
    'colleges',
    'Explore undergraduate colleges offering diverse courses and specializations. Find the perfect institution to kick-start your career with the right education.',
    ARRAY['Engineering', 'Medical', 'Arts & Humanities', 'Commerce & Business'],
    2
),
(
    'Coaching Centers',
    'coaching',
    'Discover coaching centers for competitive exams, skills development, and academic support. Get expert guidance to achieve your learning goals.',
    ARRAY['Competitive Exams', 'Language Learning', 'Arts & Music', 'Sports & Fitness'],
    3
),
(
    'PG Colleges',
    'pg-colleges',
    'Find the best postgraduate programs to advance your education and career. Compare specializations, research opportunities, and placement records.',
    ARRAY['Masters Programs', 'MBA', 'PhD', 'Specialized PG Diplomas'],
    4
); 