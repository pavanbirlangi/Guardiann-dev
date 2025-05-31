import React from "react";

interface Course {
  name: string;
  description: string;
  duration: string;
}

interface CoursesTabProps {
  courses: Course[];
}

const CoursesTab: React.FC<CoursesTabProps> = ({ courses }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Courses Offered</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-2">{course.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{course.description}</p>
            <p className="text-sm text-education-600 font-medium">Duration: {course.duration}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursesTab;
