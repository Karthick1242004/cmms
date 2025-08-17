import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating demo employee...');
    await connectDB();
    
    // Demo employee data based on the screenshot
    const demoEmployeeData = {
      name: 'Demo employee',
      email: 'demoemployee@gmail.com',
      phone: '9898786532',
      department: 'Quality Assurance',
      role: 'Senior Technician',
      status: 'active',
      avatar: '/placeholder-user.jpg',
      password: 'demo123456', // Will be hashed by pre-save middleware
      employeeId: 'DEMO001',
      joinDate: new Date(),
      accessLevel: 'super_admin',
      skills: [
        'Quality Control',
        'Process Improvement', 
        'Technical Analysis',
        'Equipment Maintenance',
        'Safety Protocols'
      ],
      certifications: [
        'Quality Management ISO 9001',
        'Safety Inspector Certification',
        'Technical Excellence Award'
      ],
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Family',
        phone: '9898786533'
      },
      shiftInfo: {
        shiftType: 'day' as const,
        shiftStartTime: '09:00',
        shiftEndTime: '18:00',
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        location: 'Quality Assurance Lab',
        effectiveDate: new Date()
      }
    };
    
    // Check if employee already exists
    let employee = await Employee.findOne({ email: 'demoemployee@gmail.com' });
    
    if (employee) {
      console.log('Demo employee already exists. Updating...');
      
      // Update existing employee
      Object.assign(employee, demoEmployeeData);
      await employee.save();
      
      console.log('Demo employee updated successfully!');
    } else {
      console.log('Creating new demo employee...');
      
      // Create new employee
      employee = new Employee(demoEmployeeData);
      await employee.save();
      
      console.log('Demo employee created successfully!');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Demo employee created/updated successfully',
      loginDetails: {
        email: 'demoemployee@gmail.com',
        password: 'demo123456',
        accessLevel: 'super_admin',
        department: 'Quality Assurance',
        role: 'Senior Technician'
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating demo employee:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create demo employee',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST method to create demo employee',
    endpoint: '/api/create-demo-user',
    method: 'POST'
  });
}
