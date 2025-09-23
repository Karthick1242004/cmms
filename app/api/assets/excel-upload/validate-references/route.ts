import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

interface ReferenceValidationRequest {
  categories: string[];
  locations: string[];
  departments: string[];
  parentSerials?: string[];
}

interface ReferenceValidationResult {
  categories: {
    valid: string[];
    invalid: string[];
  };
  locations: {
    valid: string[];
    invalid: string[];
  };
  departments: {
    valid: string[];
    invalid: string[];
  };
  parentAssets?: {
    valid: string[];
    invalid: string[];
  };
}

/**
 * POST /api/assets/excel-upload/validate-references
 * Validates that referenced entities (categories, locations, departments) exist in the system
 * 
 * Security Features:
 * - JWT authentication required
 * - Department-scoped validation for department admins
 * - No sensitive data exposure
 * - Efficient batch validation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required',
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    // 2. Authorization check
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Insufficient permissions',
          code: 'FORBIDDEN' 
        },
        { status: 403 }
      );
    }

    // 3. Extract JWT token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication token required',
          code: 'NO_TOKEN' 
        },
        { status: 401 }
      );
    }

    // 4. Parse request body
    const body: ReferenceValidationRequest = await request.json();

    if (!body.categories && !body.locations && !body.departments) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'At least one reference type must be provided',
          code: 'INVALID_REQUEST' 
        },
        { status: 400 }
      );
    }


    // 5. Initialize results
    const result: ReferenceValidationResult = {
      categories: { valid: [], invalid: [] },
      locations: { valid: [], invalid: [] },
      departments: { valid: [], invalid: [] }
    };

    // 6. Validate categories (if provided)
    if (body.categories && body.categories.length > 0) {
      try {
        // Use frontend API instead of backend server
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const categoriesResponse = await fetch(`${baseUrl}/api/assets?limit=1000`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          
          let existingCategories: string[] = [];
          
          // Handle different response formats - extract categories from assets
          let assetsArray: any[] = [];
          if (Array.isArray(categoriesData)) {
            assetsArray = categoriesData;
          } else if (categoriesData.data && categoriesData.data.assets && Array.isArray(categoriesData.data.assets)) {
            assetsArray = categoriesData.data.assets;
          } else if (categoriesData.data && Array.isArray(categoriesData.data)) {
            assetsArray = categoriesData.data;
          } else if (categoriesData.assets && Array.isArray(categoriesData.assets)) {
            assetsArray = categoriesData.assets;
          }
          
          
          // Extract unique category names from assets
          existingCategories = [...new Set(
            assetsArray
              .map((asset: any) => {
                const category = asset.category_name || asset.category || asset.categoryName || asset.assetCategory;
                return category;
              })
              .filter(Boolean)
              .map((cat: string) => cat.toLowerCase())
          )];
          
          
          body.categories.forEach(category => {
            const categoryLower = category.toLowerCase();
            if (existingCategories.includes(categoryLower)) {
              result.categories.valid.push(category);
            } else {
              result.categories.invalid.push(category);
            }
          });
        } else {
          console.error('❌ [Categories] API failed with status:', categoriesResponse.status);
          // If categories API fails, mark all as invalid
          result.categories.invalid = [...body.categories];
        }
      } catch (error) {
        console.error('❌ [Reference Validation] Categories validation error:', error);
        result.categories.invalid = [...body.categories];
      }
    }

    // 7. Validate locations (if provided)
    if (body.locations && body.locations.length > 0) {
      try {
        // Use frontend API instead of backend server
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const locationsResponse = await fetch(`${baseUrl}/api/locations?limit=1000`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          
          let existingLocations: string[] = [];
          
          // Handle different response formats - extract locations correctly
          let locationsArray: any[] = [];
          if (Array.isArray(locationsData)) {
            locationsArray = locationsData;
          } else if (locationsData.data && locationsData.data.locations && Array.isArray(locationsData.data.locations)) {
            locationsArray = locationsData.data.locations;
          } else if (locationsData.data && Array.isArray(locationsData.data)) {
            locationsArray = locationsData.data;
          } else if (locationsData.locations && Array.isArray(locationsData.locations)) {
            locationsArray = locationsData.locations;
          }
          
          
          // Extract location names using the correct field names
          existingLocations = locationsArray
            .map((loc: any) => {
              const location = loc.location_name || loc.name || loc.locationName || loc.title;
              return location;
            })
            .filter(Boolean)
            .map((loc: string) => loc.toLowerCase());
          
          
          body.locations.forEach(location => {
            const locationLower = location.toLowerCase();
            if (existingLocations.includes(locationLower)) {
              result.locations.valid.push(location);
            } else {
              result.locations.invalid.push(location);
            }
          });
        } else {
          console.error('❌ [Locations] API failed with status:', locationsResponse.status);
          result.locations.invalid = [...body.locations];
        }
      } catch (error) {
        console.error('❌ [Reference Validation] Locations validation error:', error);
        result.locations.invalid = [...body.locations];
      }
    }

    // 8. Validate departments (if provided)
    if (body.departments && body.departments.length > 0) {
      try {
        // Use frontend API instead of backend server
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const departmentsResponse = await fetch(`${baseUrl}/api/departments?limit=1000`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        
        if (departmentsResponse.ok) {
          const departmentsData = await departmentsResponse.json();
          
          let existingDepartments: string[] = [];
          
          // Handle different response formats - extract departments correctly
          let departmentsArray: any[] = [];
          if (Array.isArray(departmentsData)) {
            departmentsArray = departmentsData;
          } else if (departmentsData.data && departmentsData.data.departments && Array.isArray(departmentsData.data.departments)) {
            departmentsArray = departmentsData.data.departments;
          } else if (departmentsData.data && Array.isArray(departmentsData.data)) {
            departmentsArray = departmentsData.data;
          } else if (departmentsData.departments && Array.isArray(departmentsData.departments)) {
            departmentsArray = departmentsData.departments;
          }
          
          
          // Extract department names using the correct field names
          existingDepartments = departmentsArray
            .map((dept: any) => {
              const department = dept.department_name || dept.name || dept.departmentName || dept.title;
              return department;
            })
            .filter(Boolean)
            .map((dept: string) => dept.toLowerCase());
          
          
          body.departments.forEach(department => {
            const departmentLower = department.toLowerCase();
            
            // Department admin can only validate their own department
            if (user.accessLevel === 'department_admin' && 
                departmentLower !== user.department.toLowerCase()) {
              result.departments.invalid.push(department);
              return;
            }
            
            if (existingDepartments.includes(departmentLower)) {
              result.departments.valid.push(department);
            } else {
              result.departments.invalid.push(department);
            }
          });
        } else {
          console.error('❌ [Departments] API failed with status:', departmentsResponse.status);
          result.departments.invalid = [...body.departments];
        }
      } catch (error) {
        console.error('❌ [Reference Validation] Departments validation error:', error);
        result.departments.invalid = [...body.departments];
      }
    }

    // 9. Validate parent asset serials (if provided)
    if (body.parentSerials && body.parentSerials.length > 0) {
      result.parentAssets = { valid: [], invalid: [] };
      
      try {
        // Get existing assets to validate parent serials
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const assetsResponse = await fetch(`${baseUrl}/api/assets?limit=1000`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (assetsResponse.ok) {
          const assetsData = await assetsResponse.json();
          const existingSerials = assetsData.data?.map((asset: any) => asset.serialNo?.toUpperCase()) || [];
          
          body.parentSerials.forEach(serial => {
            const serialUpper = serial.toUpperCase();
            if (existingSerials.includes(serialUpper)) {
              result.parentAssets!.valid.push(serial);
            } else {
              result.parentAssets!.invalid.push(serial);
            }
          });
        } else {
          result.parentAssets.invalid = [...body.parentSerials];
        }
      } catch (error) {
        console.error('❌ [Reference Validation] Parent serials validation error:', error);
        result.parentAssets.invalid = [...body.parentSerials];
      }
    }

    // 10. Calculate summary
    const totalChecked = 
      (body.categories?.length || 0) + 
      (body.locations?.length || 0) + 
      (body.departments?.length || 0) + 
      (body.parentSerials?.length || 0);
      
    const totalValid = 
      result.categories.valid.length + 
      result.locations.valid.length + 
      result.departments.valid.length + 
      (result.parentAssets?.valid.length || 0);

    const totalInvalid = totalChecked - totalValid;


    // 11. Return results
    return NextResponse.json({
      success: true,
      message: 'Reference validation completed',
      data: {
        summary: {
          totalChecked,
          totalValid,
          totalInvalid,
          validationPassed: totalInvalid === 0
        },
        results: result
      }
    });

  } catch (error) {
    console.error('❌ [Reference Validation] Critical error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during reference validation',
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    );
  }
}
