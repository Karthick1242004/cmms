"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, X, AlertCircle } from "lucide-react"
import type { TabProps } from './types'

export function PersonnelTab({ formData, onChange }: TabProps) {
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
                  <Label htmlFor={`person-name-${index}`}>Name</Label>
                  <Input 
                    id={`person-name-${index}`}
                    value={person.name}
                    onChange={(e) => updatePersonnel(index, 'name', e.target.value)}
                    placeholder="Person's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`person-role-${index}`}>Role</Label>
                  <Input 
                    id={`person-role-${index}`}
                    value={person.role}
                    onChange={(e) => updatePersonnel(index, 'role', e.target.value)}
                    placeholder="Job role"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`person-email-${index}`}>Email</Label>
                  <Input 
                    id={`person-email-${index}`}
                    type="email"
                    value={person.email}
                    onChange={(e) => updatePersonnel(index, 'email', e.target.value)}
                    placeholder="email@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`person-phone-${index}`}>Phone</Label>
                  <Input 
                    id={`person-phone-${index}`}
                    value={person.phone}
                    onChange={(e) => updatePersonnel(index, 'phone', e.target.value)}
                    placeholder="+1-555-0123"
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
