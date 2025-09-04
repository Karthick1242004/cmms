"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, X, AlertCircle, Users, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEmployees } from "@/hooks/use-employees"
import type { TabProps } from './types'

interface EmployeeOption {
  id: string
  name: string
  role: string
  email: string
  department: string
}

export function PersonnelTab({ formData, onChange, user }: TabProps) {
  const [showEmployeeDropdowns, setShowEmployeeDropdowns] = useState<Record<number, boolean>>({})
  
  // Fetch employees based on selected department or user's department
  const selectedDepartment = formData.department || user?.department
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    department: selectedDepartment || undefined,
    status: 'active',
    fetchAll: true // Fetch all employees for dropdown
  })

  const employees: EmployeeOption[] = employeesData?.data?.employees || []

  const addPersonnel = () => {
    const newPerson = {
      id: `person_${Date.now()}`,
      name: '',
      role: '',
      email: '',
      phone: '',
      assignedDate: new Date().toISOString().split('T')[0],
      responsibilities: []
    }
    onChange('personnel', [...formData.personnel, newPerson])
  }

  const updatePersonnel = (index: number, field: string, value: any) => {
    const updatedPersonnel = formData.personnel.map((person, i) => 
      i === index ? { ...person, [field]: value } : person
    )
    onChange('personnel', updatedPersonnel)
  }

  const removePersonnel = (index: number) => {
    const updatedPersonnel = formData.personnel.filter((_, i) => i !== index)
    onChange('personnel', updatedPersonnel)
  }

  const handleEmployeeSelect = (index: number, employee: EmployeeOption) => {
    // Update all fields at once to avoid state conflicts
    const updatedPersonnel = formData.personnel.map((person, i) => 
      i === index ? { 
        ...person, 
        name: employee.name,
        role: employee.role,
        email: employee.email
      } : person
    )
    onChange('personnel', updatedPersonnel)
    setShowEmployeeDropdowns(prev => ({ ...prev, [index]: false }))
  }

  const toggleEmployeeDropdown = (index: number) => {
    setShowEmployeeDropdowns(prev => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Personnel Assignment
            <Button onClick={addPersonnel} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Person
            </Button>
          </CardTitle>
          <CardDescription>Assign personnel responsible for this asset</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.personnel.map((person, index) => (
            <Card key={person.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Person {index + 1}</Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removePersonnel(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>Name</Label>
                  <div className="relative">
                    <Input
                      id={`name-${index}`}
                      placeholder="Person's name"
                      value={person.name || ''}
                      onChange={employees.length > 0 ? undefined : (e) => updatePersonnel(index, 'name', e.target.value)}
                      className="pr-10"
                      readOnly={employees.length > 0}
                      style={{ cursor: employees.length > 0 ? 'pointer' : 'text' }}
                      onClick={() => employees.length > 0 && toggleEmployeeDropdown(index)}
                    />
                    {employees.length > 0 && (
                      <Popover 
                        open={showEmployeeDropdowns[index] || false} 
                        onOpenChange={(open) => setShowEmployeeDropdowns(prev => ({ ...prev, [index]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            type="button"
                            onClick={() => toggleEmployeeDropdown(index)}
                            disabled={isLoadingEmployees}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="end">
                          <Command className="w-full">
                            <CommandInput placeholder="Search employees..." />
                            <CommandEmpty>
                              {employees.length === 0 ? "No employees found in this department" : "No employees match your search."}
                            </CommandEmpty>
                            <div className="max-h-[200px] overflow-y-auto p-1">
                              {employees.map((employee) => (
                                <CommandItem
                                  key={employee.id}
                                  value={employee.name}
                                  onSelect={(selectedValue) => {
                                    // Find the employee by name to avoid closure issues
                                    const selectedEmployee = employees.find(emp => emp.name === selectedValue)
                                    if (selectedEmployee) {
                                      handleEmployeeSelect(index, selectedEmployee)
                                    }
                                  }}
                                  className="py-2 cursor-pointer hover:bg-accent"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      person.name === employee.name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{employee.name}</span>
                                    <span className="text-xs text-muted-foreground">{employee.role} - {employee.email}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </div>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                    {employees.length === 0 && !isLoadingEmployees && (
                      <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {isLoadingEmployees && (
                    <p className="text-xs text-muted-foreground">Loading employees...</p>
                  )}
                  {!selectedDepartment && (
                    <p className="text-xs text-yellow-600">Please select a department first to load employees</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`role-${index}`}>Role</Label>
                  <Input
                    id={`role-${index}`}
                    placeholder="Job role"
                    value={person.role || ''}
                    onChange={employees.length > 0 && person.name ? undefined : (e) => updatePersonnel(index, 'role', e.target.value)}
                    readOnly={employees.length > 0 && person.name}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`email-${index}`}>Email</Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    placeholder="email@company.com"
                    value={person.email || ''}
                    onChange={employees.length > 0 && person.name ? undefined : (e) => updatePersonnel(index, 'email', e.target.value)}
                    readOnly={employees.length > 0 && person.name}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`phone-${index}`}>Phone</Label>
                  <Input
                    id={`phone-${index}`}
                    placeholder="+1-555-0123"
                    value={person.phone}
                    onChange={(e) => updatePersonnel(index, 'phone', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          {formData.personnel.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No personnel assigned yet</p>
              <p className="text-sm">Click "Add Person" to assign someone to this asset</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}