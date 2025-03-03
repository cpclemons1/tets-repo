// Snowman_Starter
//***********Start main ***********

int gamesWon = 0;
int gamesLost = 0;

string userInput = GetMenuChoice();
while (userInput != "3")
{
    Route(userInput, ref gamesWon, ref gamesLost);
    userInput = GetMenuChoice();
}

Goodbye(gamesWon, gamesLost);

//************End main*************

static string GetMenuChoice()
{
    DisplayMenu();
    string userInput = Console.ReadLine();

    while (!ValidMenuChoice(userInput))
    {
        Console.WriteLine("Invalid menu choice. Please Enter a Valid Menu Choice");
        Console.WriteLine("Press any key to continue...");
        Console.ReadKey();

        DisplayMenu();
        userInput = Console.ReadLine();
    }

    return userInput;
}

static void DisplayMenu()
{
    Console.Clear();
    Console.WriteLine("1:   Play Snowman");
    Console.WriteLine("2:   See Scoreboard");
    Console.WriteLine("3:   Exit Game");
}

static bool ValidMenuChoice(string userInput)
{
    if (userInput == "1" || userInput == "2" || userInput == "3")
    {
        return true;
    }
    else
    {
        return false;
    }   /*update ValidMenuChoice to return true if the user entered 
        1, 2 or 3 and return false if they entered anything else.
        */

}

static void Route(string userInput, ref int gamesWon, ref int gamesLost)
{
    if (userInput == "1")
    {
        SnowMan(ref gamesWon, ref gamesLost);
    }
    else if (userInput == "2")
    {
        ScoreBoard(gamesWon, gamesLost);
    }
    else
    {
        Console.WriteLine("Invalid selection, please try again.");
    }
    /*update Route to call Snowman if the user 
        entered 1 and ScoreBoard if they entered 2.
        */

}

static void SnowMan(ref int gamesWon, ref int gamesLost)
{
    Console.Clear();
    string word = GetRandomWord();
    char[] displayWord = SetDisplayWord(word);
    int missed = 0;
    string guessed = "";

    while (KeepGoing(displayWord, missed))
    {
        ShowBoard(displayWord, missed, guessed);
        Console.WriteLine();
        try
        {
            char pickedLetter = Console.ReadLine().ToUpper()[0];
            CheckChoice(displayWord, word, ref missed, ref guessed, pickedLetter);
        }
        catch
        {
            Console.WriteLine("Invalid input, please choose at least one character");
            Pause();
        }
    }

    if (missed == 7)
    {
        Console.WriteLine("Sorry you lost");
        gamesLost++;
    }
    else
    {
        Console.WriteLine("You Won!");
        gamesWon++;
    }
    Console.WriteLine("Press any key to continue.....");
    Console.ReadKey();
}

static void CheckChoice(char[] displayWord, string word, ref int missed, ref string guessed, char pickedLetter)
{
    /*Check choice should check to see if the pickedLetter is in the word.

        * If it is, then it should update displayWord to show that letter and clear the screen.
        * If it isn't, then it should increased missed.
        * If the pickedLetter is found to be in the guessed variable, then the user should be told that
            that letter has already been guessed and nothing else should happen.
        * If the pickedLetter is not found in the word, then the picked letter should be added to the guessed
            variable and the other checks should continue on.
    */

    // Check to see if letter has been guessed already
    if (LetterInWord(pickedLetter, guessed))
    {
        Console.WriteLine("Letter already guessed. Guess again.");
    }
    else
    {
        // Check to see if letter is in word
        if (LetterInWord(pickedLetter, word))
        {
            for (int i = 0; i < word.Length; i++)
            {
                if (pickedLetter == word[i])
                {
                    displayWord[i] = pickedLetter;

                }
            }
            guessed += pickedLetter;
        }
        else
        {
            missed++;
            guessed += pickedLetter;
        }
    }
}

static bool LetterInWord(char letter, string word)
{
    for(int i = 0; i < word.Length; i++)
    { ////check this
        if (word[i] == letter)
        {
            return true;
        }
       
        /*Update to LetterInWord to checks to see if the letter is found 
            * anywhere in the word passed in. It should return true or false
            */

    }
    return false;
}

    static bool KeepGoing(char[] displayWord, int missed)
    {
        if (missed < 7)
        {
            for (int i = 0; i < displayWord.Length; i++)
            {
                if (displayWord[i] == '_')
                {
                    return true;
                }
            }
        }
        else
        {
            return false;
        }
        /*Update to return true if they have missed less than 7 guesses 
            * AND there are still underscores left meaning they have not 
            * fully guessed the word
            */
        return false;
    }

    static void ShowBoard(char[] displayWord, int missed, string guessed)
    {
        Console.WriteLine("Word to guess: ");
        for (int i = 0; i < displayWord.Length; i++)
        {
            Console.Write(displayWord[i]);
        }

        Console.WriteLine();
        Console.WriteLine("Letters Guessed => " + guessed);

        Console.WriteLine("Currently missed " + missed);

    }

    static char[] SetDisplayWord(string word)
    {

        char[] underscores = new char[word.Length];

        for (int i = 0; i < word.Length; i++)
        {
            underscores[i] = '_';
            
        }
        return underscores;


        /*SetDisplayWord to return a character array of 
        * underscores, of the same length of the word
        * passed into the method
        */

    }

    static string GetRandomWord()//do i need to pass things in
    {
        string[] words = GetWordList();
        Random rnd= new Random();
        int randomNum = rnd.Next(7);
        return words[randomNum];
        /*GetRandomWord to call GetWordList to retrieve the array of words,
        * chooses a word randomly from the list, and return that word
        */


    }

    static string[] GetWordList()
    {
        /*Opens file where words are stored, puts them in an array, and returns array
        * Assume there will never be more than 7 words
        */
        const int MAX_WORDS = 7;
        string[] words = new string[MAX_WORDS];
        int count = 0;//????

        StreamReader inFile = new StreamReader("words.txt");
        string line = inFile.ReadLine();
        while (line != null)
        {
            words[count] = line.ToUpper();
            count++;
            line = inFile.ReadLine();
        }
        inFile.Close();
        return words;

    }

    static void ScoreBoard(int gamesWon, int gamesLost)
    {
        Console.Clear();
        Console.WriteLine("You have won " + gamesWon + " games");
        Console.WriteLine("You have lost " + gamesLost + " games");
        Console.WriteLine("Press any key to continue...");
        Console.ReadKey();
    }

    static void Goodbye(int gamesWon, int gamesLost)
    {
        Console.Clear();
        Console.WriteLine("Thank you for playing... \n" +
            "Press any key for one final look at the scoreboard" +
            " before you go");
        Console.ReadKey();
        ScoreBoard(gamesWon, gamesLost);
    }

    static void Pause()
    {
        System.Console.WriteLine("\nPress any key to continue...");
        Console.ReadKey();
        Console.Clear();
    }