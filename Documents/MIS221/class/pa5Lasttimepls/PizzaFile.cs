using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;
using System.Xml.XPath;

namespace pa5Lasttimepls
{
    public class PizzaFile
    {
        //Fields
        private Pizza[] pizzas;

        //Constructor
        public PizzaFile(Pizza[] pizzas){
            this.pizzas = pizzas;
        }

        //Other methods

        //This method populates the array
        public Pizza[] GetAllPizzas(){ 
            pizzas = new Pizza[100]; 
            Pizza.SetCount(0);

            //Open file
            StreamReader inFile = new StreamReader("pizza-menu.txt");

            //Process file
            string line = inFile.ReadLine();
            while(line != null){
                string[] temp = line.Split('#');
                pizzas[Pizza.GetCount()] = new Pizza(int.Parse(temp[0]), temp[1], int.Parse(temp[2]), temp[3], double.Parse(temp[4]), bool.Parse(temp[5]), bool.Parse(temp[6]));
                Pizza.IncCount();
                line = inFile.ReadLine();
            }
            //Close file
            inFile.Close();
            return pizzas;
        }
        public void SaveAllPizzas(){
            //Open file
            StreamWriter outFile = new StreamWriter("pizza-menu.txt");

            //Process file
            for(int i = 0; i < Pizza.GetCount(); i++){
                outFile.WriteLine(pizzas[i].ToFile());
            }

            //Close file
            outFile.Close();
        }
    }
}