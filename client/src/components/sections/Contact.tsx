import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  company: z.string().min(2, "Company name is required"),
  phone: z.string().min(10, "Invalid phone"),
  message: z.string().optional(),
});

export function Contact() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      message: "",
    },
  });

  const submitLead = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request submitted!",
        description: "One of our specialists will contact you soon.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitLead.mutate(values);
  }

  return (
    <section id="contact" className="bg-white py-24 lg:py-32 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left Column - Info */}
          <div>
            <h2 className="dcvc-section-title text-gray-900 mb-6">Contact</h2>
            <p className="dcvc-statement text-gray-900 mb-12">
              Ready to{" "}
              <span className="text-highlight">start saving</span>?
            </p>
            
            <div className="space-y-6 text-gray-600">
              <div>
                <p className="text-sm tracking-wide text-gray-500 uppercase mb-1">Email</p>
                <p className="text-lg">contato@otimaenergia.com.br</p>
              </div>
              <div>
                <p className="text-sm tracking-wide text-gray-500 uppercase mb-1">Phone</p>
                <p className="text-lg">+55 21 99999-9999</p>
              </div>
              <div>
                <p className="text-sm tracking-wide text-gray-500 uppercase mb-1">Location</p>
                <p className="text-lg">Rio de Janeiro, Brazil</p>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm tracking-wide text-gray-500 uppercase">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your name" 
                            data-testid="input-name" 
                            className="h-12 border-gray-200 rounded-none focus:border-purple-600 focus:ring-0"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm tracking-wide text-gray-500 uppercase">
                          Phone
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+55 21 99999-9999" 
                            data-testid="input-phone" 
                            className="h-12 border-gray-200 rounded-none focus:border-purple-600 focus:ring-0"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm tracking-wide text-gray-500 uppercase">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@company.com" 
                          data-testid="input-email" 
                          className="h-12 border-gray-200 rounded-none focus:border-purple-600 focus:ring-0"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm tracking-wide text-gray-500 uppercase">
                        Company
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Company name" 
                          data-testid="input-company" 
                          className="h-12 border-gray-200 rounded-none focus:border-purple-600 focus:ring-0"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm tracking-wide text-gray-500 uppercase">
                        Message (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your energy consumption..." 
                          className="resize-none min-h-[120px] border-gray-200 rounded-none focus:border-purple-600 focus:ring-0"
                          data-testid="input-message"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <button 
                  type="submit" 
                  className="dcvc-arrow-btn group"
                  disabled={submitLead.isPending}
                  data-testid="button-submit-lead"
                >
                  <span className="arrow">
                    <ArrowRight className="w-5 h-5" />
                  </span>
                  <span className="text-gray-900 group-hover:text-purple-600 transition-colors">
                    {submitLead.isPending ? "SENDING..." : "SUBMIT REQUEST"}
                  </span>
                </button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
